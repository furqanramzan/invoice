import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  invoices,
  lineItems,
  products as productsSchema,
} from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { requireLogin } from '$lib/server/auth.js';
import { invoiceSchema } from './validations';

export const load = async () => {
  const form = await superValidate(
    {
      invoiceNumber: crypto.randomUUID(),
      store: 'sdfas',
      products: [
        {
          id: crypto.randomUUID(),
          name: 'name',
          costPrice: 12,
          unitPrice: 12,
          quantity: 2,
        },
      ],
    },
    zod4(invoiceSchema),
  );

  const products = await db.query.products.findMany();

  return { form, products };
};

export const actions = {
  default: async (event) => {
    const user = requireLogin();
    const form = await superValidate(event.request, zod4(invoiceSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { store, invoiceNumber, date, products } = form.data;

    try {
      const invoiceId = await db.transaction(async (tx) => {
        const processedProducts = await Promise.all(
          products.map(async (p) => {
            if (!p.productId) {
              // New product, create it
              const [newProduct] = await tx
                .insert(productsSchema)
                .values({
                  name: p.name,
                  costPrice: p.costPrice,
                  unitPrice: p.unitPrice,
                  userId: user.id,
                })
                .returning({ id: productsSchema.id });
              return { ...p, productId: newProduct.id };
            }
            return p;
          }),
        );

        const [invoice] = await tx
          .insert(invoices)
          .values({
            store,
            invoiceNumber,
            date: date || new Date(),
            total: processedProducts.reduce(
              (acc, p) => acc + p.quantity * p.unitPrice,
              0,
            ),
            userId: user.id,
          })
          .returning({ id: invoices.id });

        await tx.insert(lineItems).values(
          processedProducts.map((p) => ({
            productId: p.productId!,
            quantity: p.quantity,
            costPrice: p.costPrice,
            unitPrice: p.unitPrice,
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
