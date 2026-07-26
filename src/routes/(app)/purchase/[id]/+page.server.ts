import { db } from '$lib/server/db';
import { PurchasePayments, Purchases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { resolve } from '$app/paths';
import { convertToCents } from '$lib/utils.js';
import { initForm, redirectTo, validateAction } from '$lib/superforms.js';
import { paymentSchema, route, title } from './utils.js';

export async function load(event) {
  const id = Number(event.params.id);

  const purchase = await db.query.Purchases.findFirst({
    where: eq(Purchases.id, id),
    with: {
      company: { columns: { name: true } },
      supplier: { columns: { name: true } },
      items: {
        with: {
          product: { columns: { name: true, salePrice: true } },
        },
      },
      payments: {
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      },
    },
  });

  if (!purchase) {
    return redirectTo(
      route.list,
      event,
      `${title.singular} not found!`,
    );
  }

  const paymentForm = await initForm(paymentSchema, {
    date: new Date(),
  });

  const totalAmount = purchase.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const totalPaid = purchase.payments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  return {
    paymentForm,
    purchase: {
      ...purchase,
      totalAmount,
      totalPaid,
      balance: totalAmount - totalPaid,
    },
  };
}

export const actions = {
  async addPayment(event) {
    const form = await validateAction(event, paymentSchema);
    if (!form.valid) return form.error;

    const purchaseId = Number(event.params.id);

    await db.transaction(async (tx) => {
      await tx.insert(PurchasePayments).values({
        purchaseId,
        amount: convertToCents(form.data.amount),
        date: new Date(form.data.date),
        method: form.data.method || null,
        reference: form.data.reference || null,
        notes: form.data.notes || null,
      });

      const purchase = await tx.query.Purchases.findFirst({
        where: eq(Purchases.id, purchaseId),
        with: {
          items: {
            columns: { quantity: true, unitPrice: true },
          },
          payments: { columns: { amount: true } },
        },
      });

      if (purchase) {
        const totalAmount = purchase.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );
        const totalPaid = purchase.payments.reduce(
          (sum, p) => sum + p.amount,
          0,
        );

        let newStatus = 'pending';
        if (totalPaid >= totalAmount) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partial';
        }

        await tx
          .update(Purchases)
          .set({
            status: newStatus as
              | 'pending'
              | 'partial'
              | 'paid'
              | 'cancelled',
          })
          .where(eq(Purchases.id, purchaseId));
      }
    });

    return redirectTo(
      resolve(`/purchase/${purchaseId}`),
      event,
      'Payment added!',
    );
  },
};
