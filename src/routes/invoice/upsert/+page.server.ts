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
import { toISODateString } from '$lib/utils.js';

export const load = async ({ url }) => {
  requireLogin();

  const id = url.searchParams.get('id');
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
  }
  const form = await superValidate(
    currentInvoice
      ? {
          ...currentInvoice,
          date: toISODateString(currentInvoice.date),
          lineItems: currentInvoice.lineItems.map((lineItem) => ({
            ...lineItem,
            name: lineItem.product.name,
          })),
        }
      : {
          invoiceNumber: crypto.randomUUID(),
          date: toISODateString(new Date()),
        },
    zod4(invoiceSchema),
  );

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

    const { id, store, invoiceNumber, date, lineItems: products } = form.data;

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
              date: new Date(date),
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
              date: new Date(date),
              total,
              userId: user.id,
            })
            .returning({ id: invoices.id });
          form.data.id = newInvoice.id; // Assign new ID to form data for line items
        }

        if (products.length) {
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
        }
      });
    } catch (e) {
      console.error(e);
      form.message = 'Could not save invoice.';
      return fail(500, { form });
    }

    if (!id) {
      throw redirect(303, `/invoice/upsert?id=${form.data.id}`);
    }
    return { form };
  },
};
