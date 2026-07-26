import { resolve } from '$app/paths';
import z from 'zod';

export const title = {
  singular: 'Company',
  plural: 'Companies',
};

export const route = {
  list: resolve('/company'),
  upsert: resolve('/company/upsert'),
};

export const importSchema = z.object({
  logo: z.any(),
  name: z.string().optional(),
});
