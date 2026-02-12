import { db } from '$lib/server/db';
import {
  invoices,
  lineItems,
  products as productsSchema,
} from '$lib/server/db/schema';
import { invoiceSchema, route, title, type InvoiceStatus } from './utils';
import { eq, sql } from 'drizzle-orm';
import {
  initForm,
  validateAction,
  redirectTo,
  sendMessage,
} from '$lib/superforms';
import { delFile, putFile } from '$lib/server/filesystem.js';
import { convertCents, convertToCents } from '$lib/utils.js';

export const load = async (event) => {
  const id = event.url.searchParams.get('id');
  let currentInvoice = null;

  if (id) {
    currentInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        lineItems: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!currentInvoice) {
      return redirectTo(route.list, event, `${title.singular} not exists!`);
    }
  }

  const companies = await db.query.companies.findMany();
  const clients = await db.query.clients.findMany();
  const locations = await db.query.locations.findMany();

  const invoiceNumbers = await db
    .select({
      companyId: invoices.companyId,
      clientId: invoices.clientId,
      invoiceNumber: sql<number>`max(${invoices.invoiceNumber})`,
    })
    .from(invoices)
    .groupBy(invoices.companyId, invoices.clientId);
  const invoiceNumber =
    (invoiceNumbers.find((x) => x.companyId === companies.at(0)?.id)
      ?.invoiceNumber || 0) + 1;

  const form = await initForm(
    invoiceSchema,
    currentInvoice
      ? {
          ...currentInvoice,
          status: currentInvoice.status as unknown as InvoiceStatus,
          receivedAmount: currentInvoice.receivedAmount
            ? convertCents(currentInvoice.receivedAmount)
            : undefined,
          lineItems: currentInvoice.lineItems.map((lineItem) => ({
            ...lineItem,
            id: lineItem.product.id,
            name: lineItem.product.name,
            actualPrice: convertToCents(lineItem.actualPrice),
            quotedPrice: convertToCents(lineItem.quotedPrice),
            salePrice: convertToCents(lineItem.salePrice),
            receivedPrice: convertToCents(lineItem.receivedPrice),
          })),
        }
      : {
          invoiceNumber,
          companyId: companies.at(0)?.id,
          clientId: clients.at(0)?.id,
          locationId: locations.find((x) => x.clientId === clients.at(0)?.id)
            ?.id,
          dateOfDelivery: new Date(),
          dateOfInvoice: new Date(),
          status: 'draft',
          files: [],
        },
  );

  const products = await db.query.products.findMany();

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

    const { id, lineItems: products, images, ...invoiceData } = form.data;

    await db.transaction(async (tx) => {
      const processedProducts = await Promise.all(
        products.map(async (p) => {
          const productData = {
            ...p,
            quotedPrice: convertToCents(p.quotedPrice),
            salePrice: convertToCents(p.salePrice),
            actualPrice: convertToCents(p.actualPrice),
          };
          const [upsertedProduct] = await tx
            .insert(productsSchema)
            .values({
              id: p.productId || crypto.randomUUID(),
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

      const salePrice = Math.round(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.salePrice,
          0,
        ) * 100,
      );
      const actualPrice = Math.round(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.actualPrice,
          0,
        ) * 100,
      );
      const quotedPrice = Math.round(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.quotedPrice,
          0,
        ) * 100,
      );
      if (products.some((x) => x.receivedPrice)) {
        invoiceData.receivedAmount = products.reduce(
          (totalReceived, lineItem) =>
            totalReceived + (lineItem.receivedPrice || 0),
          0,
        );
      }
      if (invoiceData.receivedAmount) {
        invoiceData.receivedAmount = convertToCents(invoiceData.receivedAmount);
      }
      if (images?.length) {
        invoiceData.files = [
          ...(invoiceData?.files || []),
          ...(
            await Promise.all(
              images.map((image) =>
                putFile(`invoices/${crypto.randomUUID()}${image.name}`, image),
              ),
            )
          ).map((x, index) => ({ url: x, name: images[index].name })),
        ];
      }
      if (invoiceData.files?.some((x) => x.deleted)) {
        await Promise.all(
          invoiceData.files
            .filter((x) => x.deleted)
            .map((file) => delFile(file.url)),
        );
        // invoiceData.files = invoiceData.files.filter((file) => !file.deleted);
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
        await tx.update(invoices).set(data).where(eq(invoices.id, id));

        // Delete existing line items for this invoice
        await tx.delete(lineItems).where(eq(lineItems.invoiceId, id));
      } else {
        const [newInvoice] = await tx
          .insert(invoices)
          .values(data)
          .returning({ id: invoices.id });
        form.data.id = newInvoice.id; // Assign new ID to form data for line items
      }

      if (products.length) {
        await tx.insert(lineItems).values(
          processedProducts.map((p) => ({
            invoiceId: form.data.id!,
            productId: p.productId!,
            quantity: p.quantity,
            quotedPrice: convertToCents(p.quotedPrice),
            salePrice: convertToCents(p.salePrice),
            actualPrice: convertToCents(p.actualPrice),
            receivedPrice: convertToCents(p.receivedPrice),
          })),
        );
      }
    });

    // If create then redirect to edit page
    if (!id) {
      return redirectTo(
        // @ts-expect-error it's not string
        route.upsert + `?id=${form.data.id}`,
        event,
        `${title.singular} created!`,
      );
    }

    return sendMessage(form, `${title.plural} updated!`);
  },
};
