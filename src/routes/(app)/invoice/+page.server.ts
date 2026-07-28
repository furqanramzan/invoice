import { db } from '$lib/server/db';
import {
  Invoices,
  LineItems,
  Products,
} from '$lib/server/db/schema';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import {
  getPaginationData,
  urlSearchParamsToJson,
} from '$lib/utils.js';
import {
  initForm,
  sendMessage,
  validateAction,
} from '$lib/superforms';
import { filterSchema, title } from './upsert/utils.js';
import { delFile } from '$lib/server/filesystem.js';

export async function load(event) {
  const form = await initForm(
    filterSchema,
    urlSearchParamsToJson(event.url),
  );
  const deleteForm = await initForm(itemSchema);

  const { page, offset, limit } = getPaginationData(event);
  const { data } = form;

  const where = and(
    data.companyId
      ? eq(Invoices.companyId, data.companyId)
      : undefined,
    data.clientId
      ? eq(Invoices.clientId, data.clientId)
      : undefined,
    data.locationId
      ? eq(Invoices.locationId, data.locationId)
      : undefined,
    data.status ? eq(Invoices.status, data.status) : undefined,
    data.invoiceNumber
      ? eq(Invoices.invoiceNumber, data.invoiceNumber)
      : undefined,
    data.status ? eq(Invoices.status, data.status) : undefined,
    data.startDateOfDelivery
      ? gte(Invoices.dateOfDelivery, data.startDateOfDelivery)
      : undefined,
    data.endDateOfDelivery
      ? lte(Invoices.dateOfDelivery, data.endDateOfDelivery)
      : undefined,
    data.startDateOfInvoice
      ? gte(Invoices.dateOfInvoice, data.startDateOfInvoice)
      : undefined,
    data.endDateOfInvoice
      ? lte(Invoices.dateOfInvoice, data.endDateOfInvoice)
      : undefined,
  );

  const [allInvoices, [{ count: totalInvoices }]] =
    await Promise.all([
      db.query.Invoices.findMany({
        limit,
        offset,
        orderBy: desc(Invoices.dateOfInvoice),
        where: where,
        with: {
          company: { columns: { name: true } },
          client: { columns: { name: true } },
          location: { columns: { address: true } },
        },
      }),
      db.select({ count: count() }).from(Invoices).where(where),
    ]);

  return {
    form,
    deleteForm,
    invoices: allInvoices,
    currentPage: page,
    totalPages: Math.ceil(totalInvoices / limit),
    url: event.url,
  };
}

export const actions = {
  async delete(event) {
    const form = await validateAction(event, itemSchema);
    if (!form.valid) return form.error;

    const invoice = await db.query.Invoices.findFirst({
      where: eq(Invoices.id, form.data.id),
      columns: { status: true, attachmentUrls: true },
      with: {
        lineItems: {
          columns: { productId: true, quantity: true },
        },
      },
    });
    if (!invoice) {
      return sendMessage(
        form,
        `${title.singular} not found!`,
        'error',
      );
    }

    if (
      invoice.status !== 'draft' &&
      invoice.lineItems?.length
    ) {
      for (const item of invoice.lineItems) {
        await db
          .update(Products)
          .set({
            stock: sql`${Products.stock} + ${item.quantity}`,
          })
          .where(eq(Products.id, item.productId));
      }
    }

    if (invoice.attachmentUrls?.length) {
      await Promise.all(
        invoice.attachmentUrls.map((file) => delFile(file.url)),
      );
    }

    await db
      .delete(Invoices)
      .where(eq(Invoices.id, form.data.id));

    return sendMessage(form, `${title.plural} deleted!`);
  },
};
