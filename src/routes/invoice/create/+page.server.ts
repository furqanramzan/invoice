import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, lineItems } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { requireLogin } from '$lib/server/auth.js';
import { invoiceSchema } from './validations';

export const load = async () => {
  const form = await superValidate(zod4(invoiceSchema));
  return { form };
};

export const actions = {
  default: async (event) => {
    const user = requireLogin();
    const form = await superValidate(event.request, zod4(invoiceSchema));
    if (!form.valid) {
      console.log(form.errors);

      return fail(400, { form });
    }

    const { store, invoiceNumber, date, products } = form.data;

    try {
      const invoiceId = await db.transaction(async (tx) => {
        const [invoice] = await tx
          .insert(invoices)
          .values({
            store,
            invoiceNumber,
            date: date || new Date(),
            total: products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0),
            userId: user.id,
          })
          .returning({ id: invoices.id });

        await tx.insert(lineItems).values(
          products.map((p) => ({
            ...p,
            total: p.quantity * p.unitPrice,
            invoiceId: invoice.id,
          })),
        );

        return invoice.id;
      });

      return { form, invoiceId };
    } catch (e) {
      console.error(e);
      return fail(500, { message: 'Could not create invoice.' });
    }
  },
};
