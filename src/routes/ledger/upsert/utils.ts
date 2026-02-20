import z from 'zod';
import { resolve } from '$app/paths';

export const title = {
  singular: 'Ledger',
  plural: 'Ledger',
};

export const route = {
  list: resolve('/ledger'),
  upsert: resolve('/ledger/upsert'),
  invoiceUpsert: resolve('/invoice/upsert'),
};

export const compareLedgerSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
    file: z.any(),
    name: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const payLedgerSchema = z.object({
  receivedAmount: z.number().min(0),
});
