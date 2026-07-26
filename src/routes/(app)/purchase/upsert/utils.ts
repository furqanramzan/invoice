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

export const purchaseItemSchema = z.object({
  productId: z.number().positive(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
});

export const purchaseSchema = z.object({
  id: z.number().positive().optional(),
  companyId: z.coerce.number().positive(),
  supplierId: z.coerce.number().positive(),
  purchaseNumber: z.number().positive(),
  date: z.date(),
  status: z
    .enum(['pending', 'partial', 'paid', 'cancelled'])
    .default('pending'),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema),
});

export type PurchaseSchema = z.infer<typeof purchaseSchema>;
