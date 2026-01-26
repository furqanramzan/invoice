import z from 'zod';
import { resolve } from '$app/paths';

export const title = { singular: 'Product', plural: 'Products' };

export const route = {
  list: resolve('/product'),
  upsert: resolve('/product/upsert'),
};

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  costPrice: z.number().min(0, { message: 'Cost price cannot be negative' }),
  unitPrice: z.number().min(0, { message: 'Unit price cannot be negative' }),
});
