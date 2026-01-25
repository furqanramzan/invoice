import { db } from '$lib/server/db';
import { invoices, lineItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireLogin } from '$lib/server/auth.js';
import { itemSchema } from '$lib/validations.js';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { sleep } from '$lib/utils.js';

export async function load(event) {
  requireLogin();

  const form = await superValidate(zod4(itemSchema));

  const page = Number(event.url.searchParams.get('page')) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const allInvoices = await db.query.invoices.findMany({
    limit,
    offset,
    with: {
      lineItems: {
        with: {
          product: true,
        },
      },
    },
    orderBy: (invoices, { desc }) => [desc(invoices.date)],
  });

  const totalInvoices = await db.select().from(invoices);

  return {
    form,
    invoices: allInvoices,
    currentPage: page,
    totalPages: Math.ceil(totalInvoices.length / limit),
  };
}

export const actions = {
  async delete(event) {
    const form = await superValidate(event.request, zod4(itemSchema));
    console.log(form);

    if (!form.valid) {
      return fail(400, { form });
    }
    await sleep(3000);
    await db.transaction(async (tx) => {
      await tx.delete(lineItems).where(eq(lineItems.invoiceId, form.data.id));
      await tx.delete(invoices).where(eq(invoices.id, form.data.id));
    });
    return message(form, 'Invoice deleted succcessfully');
  },
};
