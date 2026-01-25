import { fail, redirect } from '@sveltejs/kit';
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
import { eq } from 'drizzle-orm';

export const load = async ({ url }) => {
  requireLogin();

  const id = url.searchParams.get('id');
  let form;
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
      throw redirect(302, '/invoice');
    }

    form = await superValidate(
      {
        id: currentInvoice.id,
        store: currentInvoice.store,
        invoiceNumber: currentInvoice.invoiceNumber,
        date: currentInvoice.date,
        products: currentInvoice.lineItems.map((item) => ({
          id: item.id.toString(),
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          costPrice: item.costPrice,
          unitPrice: item.unitPrice,
        })),
      },
      zod4(invoiceSchema),
    );
  } else {
    form = await superValidate(
      {
        invoiceNumber: crypto.randomUUID(),
        store: '',
        products: [
          {
            id: crypto.randomUUID(),
            name: '',
            quantity: 1,
            costPrice: 0,
            unitPrice: 0,
          },
        ],
      },
      zod4(invoiceSchema),
    );
  }

  const products = await db.query.products.findMany();

  return { form, products, currentInvoice };
};

export const actions = {
  default: async (event) => {
    const user = requireLogin();
    const form = await superValidate(event.request, zod4(invoiceSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { id, store, invoiceNumber, date, products } = form.data;

    try {
      await db.transaction(async (tx) => {
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

        const total = processedProducts.reduce(
          (acc, p) => acc + p.quantity * p.unitPrice,
          0,
        );

        if (id) {
          // Update existing invoice
          await tx
            .update(invoices)
            .set({
              store,
              invoiceNumber,
              date: date || new Date(),
              total,
              userId: user.id,
            })
            .where(eq(invoices.id, id));

          // Delete existing line items for this invoice
          await tx.delete(lineItems).where(eq(lineItems.invoiceId, id));
        } else {
          // Insert new invoice
          const [newInvoice] = await tx
            .insert(invoices)
            .values({
              store,
              invoiceNumber,
              date: date || new Date(),
              total,
              userId: user.id,
            })
            .returning({ id: invoices.id });
          form.data.id = newInvoice.id; // Assign new ID to form data for line items
        }

        await tx.insert(lineItems).values(
          processedProducts.map((p) => ({
            productId: p.productId!,
            quantity: p.quantity,
            costPrice: p.costPrice,
            unitPrice: p.unitPrice,
            total: p.quantity * p.unitPrice,
            invoiceId: form.data.id!,
          })),
        );
      });

      return { form };
    } catch (e) {
      console.error(e);
      return fail(500, { message: 'Could not save invoice.' });
    }
  },
};
