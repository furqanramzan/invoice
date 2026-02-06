import z from 'zod';
import { resolve } from '$app/paths';

export const title = { singular: 'Invoice', plural: 'Invoices' };

export const route = {
  list: resolve('/invoice'),
  upsert: resolve('/invoice/upsert'),
};

export const lineItemSchema = z.object({
  id: z.string().optional(), // Made optional for upsert
  productId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().gt(0),
  costPrice: z.number().min(0),
  unitPrice: z.number().min(0),
});
const invoiceStatus = z
  .enum(['draft', 'processing', 'delivered', 'returned'])
  .default('draft');
export type InvoiceStatus = z.infer<typeof invoiceStatus>;
export const invoiceSchema = z.object({
  id: z.string().optional(), // Added and made optional for upsert
  store: z.string().nullable(),
  invoiceNumber: z.number().positive(),
  companyId: z.uuidv4(),
  clientId: z.uuidv4(),
  date: z.date(),
  lineItems: z.array(lineItemSchema),
  status: invoiceStatus,
  files: z
    .object({ url: z.url(), name: z.string(), deleted: z.boolean().optional() })
    .array()
    .optional()
    .nullable(),
  images: z
    .instanceof(File, { message: 'Please upload a file.' })
    .refine((f) => f.size < 100_000_000, 'Max 100 kB upload size.')
    .array()
    .optional(),
});
