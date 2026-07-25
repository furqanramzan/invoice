import z from 'zod';
import { resolve } from '$app/paths';

export const title = {
  singular: 'Purchase',
  plural: 'Purchases',
};

export const route = {
  list: resolve('/purchase'),
  upsert: resolve('/purchase/upsert'),
};

export const statuses = [
  { value: 'pending', color: 'yellow' },
  { value: 'partial', color: 'blue' },
  { value: 'paid', color: 'green' },
  { value: 'cancelled', color: 'red' },
];

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0, 'Amount is required'),
  date: z.date(),
  method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PaymentSchema = z.infer<typeof paymentSchema>;
