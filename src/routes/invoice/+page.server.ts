import { db } from '$lib/server/db';
import { Invoices, LineItems } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import { getPaginationData } from '$lib/utils.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms';
import { title } from './upsert/utils.js';

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

    await db.transaction(async (tx) => {
      await tx.delete(LineItems).where(eq(LineItems.invoiceId, form.data.id));
      await tx.delete(Invoices).where(eq(Invoices.id, form.data.id));
    });

    return sendMessage(form, `${title.plural} deleted!`);
  },
};
