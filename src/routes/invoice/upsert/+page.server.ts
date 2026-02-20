import { db } from '$lib/server/db';
import {
  Invoices,
  LineItems,
  Products as productsSchema,
} from '$lib/server/db/schema';
import {
  invoiceSchema,
  route,
  title,
  type InvoiceStatus,
} from './utils';
import { eq, sql } from 'drizzle-orm';
import {
  initForm,
  validateAction,
  redirectTo,
} from '$lib/superforms';
import { delFile, putFile } from '$lib/server/filesystem.js';
import { convertCents, convertToCents } from '$lib/utils.js';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentInvoice = null;

  if (id) {
    currentInvoice = await db.query.Invoices.findFirst({
      where: eq(Invoices.id, id),
      with: {
        lineItems: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!currentInvoice) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not exists!`,
      );
    }
  }

  const [{ clients, companies, locations }, products] =
    await Promise.all([
      event.parent(),
      db.query.Products.findMany(),
    ]);
  const transactionIndex = products.findIndex(
    (x) => x.name === 'Transportation',
  );
  const transaction = products[transactionIndex];
  if (transaction) {
    products.splice(transactionIndex, 1);
    products.unshift(transaction);
  }

  const invoiceNumbers = await db
    .select({
      companyId: Invoices.companyId,
      clientId: Invoices.clientId,
      invoiceNumber: sql<number>`max(${Invoices.invoiceNumber})`,
    })
    .from(Invoices)
    .groupBy(Invoices.companyId, Invoices.clientId);
  const invoiceNumber =
    (invoiceNumbers.find(
      (x) => x.companyId === companies.at(0)?.id,
    )?.invoiceNumber || 0) + 1;

  const form = await initForm(
    invoiceSchema,
    currentInvoice
      ? {
          ...currentInvoice,
          status:
            currentInvoice.status as unknown as InvoiceStatus,
          receivedAmount: currentInvoice.receivedAmount
            ? convertCents(currentInvoice.receivedAmount)
            : undefined,
          lineItems: currentInvoice.lineItems.map(
            (lineItem) => ({
              ...lineItem,
              id: lineItem.product.id,
              name: lineItem.product.name,
              actualPrice: convertCents(lineItem.actualPrice),
              quotedPrice: convertCents(lineItem.quotedPrice),
              salePrice: convertCents(lineItem.salePrice),
              receivedPrice: convertCents(
                lineItem.receivedPrice,
              ),
            }),
          ),
        }
      : {
          invoiceNumber,
          companyId: companies.at(0)?.id,
          clientId: clients.at(0)?.id,
          locationId: locations.find(
            (x) => x.clientId === clients.at(0)?.id,
          )?.id,
          dateOfDelivery: new Date(),
          dateOfInvoice: new Date(),
          status: 'draft',
          attachmentUrls: [],
        },
  );

  return {
    form,
    locations,
    products,
    invoiceNumbers,
    companies,
    clients,
    currentInvoice,
  };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, invoiceSchema);
    if (!form.valid) return form.error;

    const {
      id,
      lineItems: products,
      attachments,
      ...invoiceData
    } = form.data;

    await db.transaction(async (tx) => {
      const processedProducts = await Promise.all(
        products.map(async (p) => {
          const productData = {
            ...p,
            receivedPrice: convertToCents(p.receivedPrice),
            quotedPrice: convertToCents(p.quotedPrice),
            salePrice: convertToCents(p.salePrice),
            actualPrice: convertToCents(p.actualPrice),
          };
          const [upsertedProduct] = await tx
            .insert(productsSchema)
            .values({
              id: p.productId,
              ...productData,
            })
            .onConflictDoUpdate({
              target: productsSchema.id,
              set: productData,
            })
            .returning({ id: productsSchema.id });
          return { ...p, productId: upsertedProduct.id };
        }),
      );

      const salePrice = convertToCents(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.salePrice,
          0,
        ),
      );
      const actualPrice = convertToCents(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.actualPrice,
          0,
        ),
      );
      const quotedPrice = convertToCents(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.quotedPrice,
          0,
        ),
      );
      if (products.some((x) => x.receivedPrice)) {
        invoiceData.receivedAmount = products.reduce(
          (totalReceived, lineItem) =>
            totalReceived + (lineItem.receivedPrice || 0),
          0,
        );
      }
      if (invoiceData.receivedAmount) {
        invoiceData.receivedAmount = convertToCents(
          invoiceData.receivedAmount,
        );
      }
      if (attachments?.length) {
        invoiceData.attachmentUrls = [
          ...(invoiceData?.attachmentUrls || []),
          ...(
            await Promise.all(
              attachments.map((image) =>
                putFile(
                  `invoices/${crypto.randomUUID()}-${image.name}`,
                  image,
                ),
              ),
            )
          ).map((x, index) => ({
            url: x,
            name: attachments[index].name,
          })),
        ];
      }
      if (invoiceData.attachmentUrls?.some((x) => x.deleted)) {
        await Promise.all(
          invoiceData.attachmentUrls
            .filter((x) => x.deleted)
            .map((file) => delFile(file.url)),
        );
        invoiceData.attachmentUrls =
          invoiceData.attachmentUrls.filter(
            (file) => !file.deleted,
          );
      }

      const data = {
        ...invoiceData,
        actualPrice,
        quotedPrice,
        salePrice,
        dateOfDelivery: new Date(invoiceData.dateOfDelivery),
        dateOfInvoice: new Date(invoiceData.dateOfInvoice),
      };

      if (id) {
        await tx
          .update(Invoices)
          .set(data)
          .where(eq(Invoices.id, id));

        // Delete existing line items for this invoice
        await tx
          .delete(LineItems)
          .where(eq(LineItems.invoiceId, id));
      } else {
        const [newInvoice] = await tx
          .insert(Invoices)
          .values(data)
          .returning({ id: Invoices.id });
        form.data.id = newInvoice.id; // Assign new ID to form data for line items
      }

      if (products.length) {
        await tx.insert(LineItems).values(
          processedProducts.map((p) => ({
            invoiceId: form.data.id!,
            productId: p.productId!,
            quantity: p.quantity,
            remarks: p.remarks,
            quotedPrice: convertToCents(p.quotedPrice),
            salePrice: convertToCents(p.salePrice),
            actualPrice: convertToCents(p.actualPrice),
            receivedPrice: convertToCents(p.receivedPrice),
          })),
        );
      }
    });

    return redirectTo(
      route.list,
      event,
      `${title.singular}  ${id ? 'updated' : 'created'}!`,
    );
  },
};
