import { db } from '$lib/server/db';
import { Invoices } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import { getPaginationData } from '$lib/utils.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms';
import { title } from './upsert/utils.js';
import { delFile } from '$lib/server/filesystem.js';

export async function load(event) {
  const form = await initForm(itemSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allInvoices, [{ count: totalInvoices }]] = await Promise.all([
    db.query.Invoices.findMany({
      limit,
      offset,
      orderBy: desc(Invoices.dateOfInvoice),
      with: {
        company: { columns: { name: true } },
        client: { columns: { name: true } },
      },
    }),
    db.select({ count: count() }).from(Invoices),
  ]);

  return {
    form,
    invoices: allInvoices,
    currentPage: page,
    totalPages: Math.ceil(totalInvoices / limit),
  };
}

export const actions = {
  async default(event) {
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
};
