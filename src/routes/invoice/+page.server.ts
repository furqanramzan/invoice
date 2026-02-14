import { db } from '$lib/server/db';
import { invoices, lineItems } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import { getPaginationData } from '$lib/utils.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms';
import { title } from './upsert/utils.js';

export async function load(event) {
  const form = await initForm(itemSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allInvoices, [{ count: totalInvoices }]] = await Promise.all([
    db.query.invoices.findMany({
      limit,
      offset,
      orderBy: desc(invoices.dateOfInvoice),
      with: {
        company: { columns: { name: true } },
        client: { columns: { name: true } },
      },
    }),
    db.select({ count: count() }).from(invoices),
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

    await db.transaction(async (tx) => {
      await tx.delete(lineItems).where(eq(lineItems.invoiceId, form.data.id));
      await tx.delete(invoices).where(eq(invoices.id, form.data.id));
    });

    return sendMessage(form, `${title.plural} deleted!`);
  },
};
