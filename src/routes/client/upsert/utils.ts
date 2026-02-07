import { resolve } from '$app/paths';
import z from 'zod';

export const title = { singular: 'Client', plural: 'Clients' };

export const route = {
  list: resolve('/client'),
  upsert: resolve('/client/upsert'),
};

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  address: z.string(),
  attention: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});
