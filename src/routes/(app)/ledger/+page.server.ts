import { db } from '$lib/server/db';
import { Invoices } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import {
  convertToCents,
  getPaginationData,
} from '$lib/utils.js';
import {
  initForm,
  sendMessage,
  validateAction,
} from '$lib/superforms';
import { payLedgerSchema } from './upsert/utils.js';
import type { InvoiceStatus } from '../invoice/upsert/utils.js';

export async function load(event) {
  const form = await initForm(payLedgerSchema);

  const { page, offset, limit } = getPaginationData(event);

  const where = eq(
    Invoices.status,
    'disputed' satisfies InvoiceStatus,
  );
  const [allInvoices, [{ count: totalInvoices }]] =
    await Promise.all([
      db.query.Invoices.findMany({
        limit,
        offset,
        where,
        orderBy: desc(Invoices.dateOfInvoice),
        columns: {
          id: true,
          invoiceNumber: true,
          salePrice: true,
          receivedAmount: true,
          dateOfDelivery: true,
          dateOfInvoice: true,
        },
        with: {
          company: { columns: { name: true } },
          client: { columns: { name: true } },
          location: { columns: { address: true } },
        },
      }),
      db.select({ count: count() }).from(Invoices).where(where),
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
    const form = await validateAction(event, payLedgerSchema);
    if (!form.valid) return form.error;

    const id = Number(event.url.searchParams.get('id'));
    if (!id) {
      return sendMessage(form, `Missing invoice id!`, 'error');
    }

    const [invoice] = await db
      .update(Invoices)
      .set({
        status: 'paid' satisfies InvoiceStatus,
        receivedAmount: convertToCents(form.data.receivedAmount),
      })
      .where(eq(Invoices.id, id))
      .returning({ invoiceNumber: Invoices.invoiceNumber });

    return sendMessage(
      form,
      `Invoice # ${invoice.invoiceNumber} paid!`,
    );
  },
};
