import { db } from '$lib/server/db';
import {
  invoices,
  lineItems,
  products as productsSchema,
} from '$lib/server/db/schema';
import { invoiceSchema, route, title, type InvoiceStatus } from './utils';
import { eq, sql } from 'drizzle-orm';
import { getUser } from '$lib/server/auth.js';
import {
  initForm,
  validateAction,
  redirectTo,
  sendMessage,
} from '$lib/superforms';
import { delFile, putFile } from '$lib/server/filesystem.js';

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

  const companies = await db.query.companies.findMany({
    columns: { id: true, name: true, printLayout: true, logoUrl: true },
  });

  const invoicenumbers = await db
    .select({
      companyId: invoices.companyId,
      invoiceNumber: sql<number>`max(${invoices.invoiceNumber})`,
    })
    .from(invoices)
    .groupBy(invoices.companyId);
  const invoiceNumber =
    (invoicenumbers.find((x) => x.companyId === companies.at(0)?.id)
      ?.invoiceNumber || 0) + 1;

  const form = await initForm(
    invoiceSchema,
    currentInvoice
      ? {
          ...currentInvoice,
          status: currentInvoice.status as unknown as InvoiceStatus,
          lineItems: currentInvoice.lineItems.map((lineItem) => ({
            ...lineItem,
            name: lineItem.product.name,
            costPrice: lineItem.costPrice / 100,
            unitPrice: lineItem.unitPrice / 100,
          })),
        }
      : {
          invoiceNumber,
          companyId: companies.at(0)?.id,
          date: new Date(),
          status: 'draft',
          files: [],
        },
  );

  const products = await db.query.products.findMany();

  return { form, products, invoicenumbers, companies, currentInvoice };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, invoiceSchema);
    if (!form.valid) return form.error;

    const user = getUser();

    const { id, lineItems: products, images, ...invoiceData } = form.data;

    await db.transaction(async (tx) => {
      // Fetch the current invoice from the database if editing
      let existingInvoice = null;
      if (id) {
        existingInvoice = await tx.query.invoices.findFirst({
          where: eq(invoices.id, id),
          columns: { status: true },
        });
      }

      if (
        existingInvoice &&
        (existingInvoice.status === 'delivered' ||
          existingInvoice.status === 'returned')
      ) {
        // If the status is changing, update only the status.
        if (invoiceData.status !== existingInvoice.status && id) {
          await tx
            .update(invoices)
            .set({ status: invoiceData.status })
            .where(eq(invoices.id, id));
          return { form };
        }
        // If the status is not changing, and the invoice is delivered or returned,
        // no other fields should be modifiable. Reject the submission.
        return sendMessage(
          form,
          `Cannot modify a delivered or returned invoice!`,
          'error',
        );
      }

      const processedProducts = await Promise.all(
        products.map(async (p) => {
          const productData = {
            ...p,
            userId: user.id,
            costPrice: Math.round(p.costPrice * 100),
            unitPrice: Math.round(p.unitPrice * 100),
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

      const total = Math.round(
        processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.unitPrice,
          0,
        ) * 100,
      );
      if (images?.length) {
        invoiceData.files = [
          ...(invoiceData?.files || []),
          ...(
            await Promise.all(
              images.map((image) =>
                putFile(
                  `invoices/${invoiceData.date.getMonth() + 1}${invoiceData.date.getFullYear()}/${crypto.randomUUID()}${image.name}`,
                  image,
                ),
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
        store: 'cutom',
        total,
        date: new Date(invoiceData.date),
        userId: user.id,
      };

      if (id) {
        await tx.update(invoices).set(data).where(eq(invoices.id, id));

        // Delete existing line items for this invoice
        await tx.delete(lineItems).where(eq(lineItems.invoiceId, id));
      } else {
        const [newInvoice] = await tx
          .insert(invoices)
          .values({ ...data })
          .returning({ id: invoices.id });
        form.data.id = newInvoice.id; // Assign new ID to form data for line items
      }

      if (products.length) {
        await tx.insert(lineItems).values(
          processedProducts.map((p) => ({
            productId: p.productId!,
            quantity: p.quantity,
            costPrice: Math.round(p.costPrice * 100),
            unitPrice: Math.round(p.unitPrice * 100),
            invoiceId: form.data.id!,
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
