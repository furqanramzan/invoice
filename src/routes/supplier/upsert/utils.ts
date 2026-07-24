import z from 'zod';
import { resolve } from '$app/paths';

export const title = {
  singular: 'Supplier',
  plural: 'Suppliers',
};

export const route = {
  list: resolve('/supplier'),
  upsert: resolve('/supplier/upsert'),
};

export const supplierSchema = z.object({
  id: z.number().positive().optional(),
  companyId: z.coerce.number().positive(),
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.number().min(0).optional().default(0),
});

export const deleteSchema = z.object({
  id: z.number(),
});
