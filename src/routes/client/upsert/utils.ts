import { resolve } from '$app/paths';
import z from 'zod';

export const title = {
  singular: 'Client',
  plural: 'Clients',
};

export const route = {
  list: resolve('/client'),
  upsert: resolve('/client/upsert'),
};

export const clientSchema = z.object({
  id: z.number().positive().optional(),
  companyId: z.coerce.number().positive(),
  name: z.string().min(1, { message: 'Name is required' }),
  locations: z
    .object({
      id: z.number().positive().optional(),
      deleted: z.boolean().optional(),
      address: z.string(),
    })
    .array()
    .min(1),
  attention: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  invoiceNumberInitial: z.string(),
});
