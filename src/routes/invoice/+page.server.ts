import { db } from '$lib/server/db';
import { Invoices } from '$lib/server/db/schema';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import { getPaginationData, urlSearchParamsToJson } from '$lib/utils.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms';
import { filterSchema, statusSchema, title } from './upsert/utils.js';
import { delFile } from '$lib/server/filesystem.js';

export async function load(event) {
  const form = await initForm(filterSchema, urlSearchParamsToJson(event.url));
  const deleteForm = await initForm(itemSchema);
  const statusForm = await initForm(statusSchema);

  const { page, offset, limit } = getPaginationData(event);
  const { data } = form;

  const where = and(
    data.companyId ? eq(Invoices.companyId, data.companyId) : undefined,
    data.clientId ? eq(Invoices.clientId, data.clientId) : undefined,
    data.locationId ? eq(Invoices.locationId, data.locationId) : undefined,
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

  const [allInvoices, [{ count: totalInvoices }]] = await Promise.all([
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
    statusForm,
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
      columns: { attachmentUrls: true },
    });
    if (!invoice) {
      return sendMessage(form, `${title.singular} not found!`, 'error');
    }

    if (invoice.attachmentUrls?.length) {
      await Promise.all(
        invoice.attachmentUrls.map((file) => delFile(file.url)),
      );
    }

    await db.delete(Invoices).where(eq(Invoices.id, form.data.id));

    return sendMessage(form, `${title.plural} deleted!`);
  },
  async status(event) {
    const form = await validateAction(event, statusSchema);
    if (!form.valid) return form.error;

    const id = Number(event.url.searchParams.get('id'));
    if (!id) {
      return sendMessage(form, `Missing invoice id!`, 'error');
    }

    await db
      .update(Invoices)
      .set({
        status: form.data.status,
      })
      .where(eq(Invoices.id, id));

    return sendMessage(form, `${title.plural} status updated!`);
  },
};
