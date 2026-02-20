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

const printLayoutEnum = z.enum(['A', 'B']).default('A');
export type PrintLayout = z.infer<typeof printLayoutEnum>;

export const companySchema = z.object({
  id: z.number().positive().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  address: z.string(),
  office: z.string(),
  email: z.email({ message: 'Invalid email address' }),
  phone: z.string(),
  logo: z
    .instanceof(File, { message: 'Please upload a file.' })
    .refine(
      (f) => f.size < 100_000_000,
      'Max 100 MB upload size.',
    )
    .optional(),
  logoUrl: z.string().nullable().optional(),
  printLayout: printLayoutEnum,
});
