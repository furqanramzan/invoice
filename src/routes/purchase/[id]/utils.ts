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

export const paymentMethods = [
  { value: 'Cash', color: 'green' },
  { value: 'Bank Transfer', color: 'blue' },
  { value: 'Check', color: 'yellow' },
  { value: 'Credit Card', color: 'purple' },
  { value: 'Other', color: 'gray' },
];

const paymentMethod = z.enum([
  'Cash',
  'Bank Transfer',
  'Check',
  'Credit Card',
  'Other',
]);

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0, 'Amount is required'),
  date: z.date(),
  method: paymentMethod.optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PaymentSchema = z.infer<typeof paymentSchema>;
