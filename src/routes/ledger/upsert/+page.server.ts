import {
  initForm,
  redirectTo,
  sendMessage,
  validateAction,
} from '$lib/superforms.js';
import { snakeCase } from 'text-case';
import { compareLedgerSchema, route } from './utils.js';
import pkg from 'xlsx';
import { db } from '$lib/server/db/index.js';
import {
  and,
  gte,
  inArray,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { Invoices } from '$lib/server/db/schema.js';
import { convertCents, convertToCents } from '$lib/utils.js';
import type { InvoiceStatus } from '../../invoice/upsert/utils.js';
const { readFile, utils } = pkg;

export async function load() {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() - 5);
  endDate.setMonth(endDate.getMonth() + 1, 0);
  const form = await initForm(compareLedgerSchema, {
    startDate,
    endDate,
  });

  return { form };
}

export const actions = {
  async default(event) {
    const form = await validateAction(
      event,
      compareLedgerSchema,
    );
    if (!form.valid) return form.error;

    const buffer = await form.data.file.arrayBuffer();
    const workbook = readFile(buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = utils
      .sheet_to_json(sheet, { raw: false })
      .map((row) =>
        Object.fromEntries(
          Object.entries(row as Record<string, unknown>).map(
            ([k, v]) => [snakeCase(k), v],
          ),
        ),
      ) as Array<{
      offset_invoice_number?: string;
      amount_settled: string;
    }>;

    if (!data.length) {
      return sendMessage(form, 'No data found!', 'error');
    }

    const companies = await db.query.Clients.findMany({
      columns: { invoiceNumberInitial: true },
    });

    const ledgerInvoices: Map<
      number,
      {
        invoiceNumber: number;
        amount: number;
      }
    > = new Map();
    data
      .filter((x) => x.offset_invoice_number)
      .forEach((x) => {
        companies.forEach((company) =>
          (x.offset_invoice_number || '').replaceAll(
            company.invoiceNumberInitial,
            '',
          ),
        );
        const invoiceNumber = Number(x.offset_invoice_number);
        const amount = Number(
          x.amount_settled.replaceAll(',', ''),
        );
        ledgerInvoices.set(invoiceNumber, {
          invoiceNumber,
          amount,
        });
      });

    const invoices = await db.query.Invoices.findMany({
      where: and(
        or(
          inArray(
            Invoices.invoiceNumber,
            Array.from(ledgerInvoices.keys()),
          ),
          and(
            gte(Invoices.dateOfInvoice, form.data.startDate),
            lte(Invoices.dateOfInvoice, form.data.endDate),
          ),
        ),
        ne(Invoices.status, 'paid' satisfies InvoiceStatus),
      ),
      columns: {
        id: true,
        invoiceNumber: true,
        salePrice: true,
      },
    });

    const paidInvoices = invoices.filter((invoice) => {
      const ledgerInvoice = ledgerInvoices.get(
        invoice.invoiceNumber,
      );
      if (!ledgerInvoice) {
        return false;
      }
      return (
        ledgerInvoice.amount === convertCents(invoice.salePrice)
      );
    });
    const unpaidInvoices = invoices
      .filter(
        (invoice) =>
          !paidInvoices.some((x) => x.id === invoice.id),
      )
      .map((invoice) => {
        const ledgerInvoice = ledgerInvoices.get(
          invoice.invoiceNumber,
        );
        return {
          ...invoice,
          receivedAmount: ledgerInvoice?.amount || 0,
        };
      });

    await db.transaction(async (tx) => {
      await tx
        .update(Invoices)
        .set({
          receivedAmount: sql`${Invoices.salePrice}`,
          status: 'paid' satisfies InvoiceStatus,
        })
        .where(
          inArray(
            Invoices.id,
            paidInvoices.map((x) => x.id),
          ),
        );

      await tx
        .update(Invoices)
        .set({
          status: 'disputed' satisfies InvoiceStatus,
          receivedAmount: sql`
              CASE
                ${sql.join(
                  unpaidInvoices.map(
                    (x) =>
                      sql`WHEN ${Invoices.id} = ${x.id} THEN ${convertToCents(x.receivedAmount)}`,
                  ),
                  sql` `,
                )}
              END
            `,
        })
        .where(
          inArray(
            Invoices.id,
            unpaidInvoices.map((x) => x.id),
          ),
        );
    });

    return redirectTo(route.list, event, 'Ledger imported!');
  },
};
