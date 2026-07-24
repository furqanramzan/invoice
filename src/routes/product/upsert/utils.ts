import z from 'zod';
import { resolve } from '$app/paths';

export const title = {
  singular: 'Product',
  plural: 'Products',
};

export const route = {
  list: resolve('/product'),
  upsert: resolve('/product/upsert'),
};

export const productSchema = z.object({
  id: z.number().positive().optional(),
  companyId: z.coerce.number().positive(),
  name: z.string().min(1, { message: 'Name is required' }),
  actualPrice: z
    .number()
    .min(0, { message: 'Actual price cannot be negative' }),
  quotedPrice: z
    .number()
    .min(0, { message: 'Quoted price cannot be negative' }),
  salePrice: z
    .number()
    .min(0, { message: 'Sale price cannot be negative' }),
});
