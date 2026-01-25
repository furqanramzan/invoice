import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
  invoices,
  lineItems,
  products as productsSchema,
} from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { invoiceSchema, type InvoiceStatus } from './validations';
import { eq } from 'drizzle-orm';
import { toISODateString } from '$lib/utils.js';
import { resolve } from '$app/paths';
import { getUser } from '$lib/server/auth.js';

export const load = async ({ url }) => {
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
      return redirect(302, resolve('/invoice'));
    }
  }
  const form = await superValidate(
    currentInvoice
      ? {
          ...currentInvoice,
          status: currentInvoice.status as unknown as InvoiceStatus,
          date: toISODateString(currentInvoice.date),
          lineItems: currentInvoice.lineItems.map((lineItem) => ({
            ...lineItem,
            name: lineItem.product.name,
          })),
        }
      : {
          invoiceNumber: crypto.randomUUID(),
          date: toISODateString(new Date()),
          status: 'draft',
        },
    zod4(invoiceSchema),
  );

  const products = await db.query.products.findMany();

  return { form, products, currentInvoice };
};

export const actions = {
  default: async (event) => {
    const user = getUser();
    const form = await superValidate(event.request, zod4(invoiceSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const {
      id,
      store,
      invoiceNumber,
      date,
      lineItems: products,
      status,
    } = form.data;

    try {
      await db.transaction(async (tx) => {
        // Fetch the current invoice from the database if editing
        let existingInvoice = null;
        if (id) {
          existingInvoice = await tx.query.invoices.findFirst({
            where: eq(invoices.id, id),
          });
        }

        if (
          existingInvoice &&
          (existingInvoice.status === 'delivered' ||
            existingInvoice.status === 'returned')
        ) {
          // If the status is changing, update only the status.
          if (status !== existingInvoice.status && id) {
            await tx
              .update(invoices)
              .set({ status: status })
              .where(eq(invoices.id, id));
            return { form }; // Only status was updated
          } else {
            // If the status is not changing, and the invoice is delivered or returned,
            // no other fields should be modifiable. Reject the submission.
            form.message =
              'Cannot modify a delivered or returned invoice except for its status.';
            return fail(400, { form });
          }
        }

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
              status,
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
              status, // Include status in insert
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
      return redirect(302, resolve('/invoice/upsert') + `?id=${form.data.id}`);
    }
    return { form };
  },
};
