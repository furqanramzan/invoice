import z from 'zod';
import { resolve } from '$app/paths';
import type { Option } from '$lib/utils';

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
  actualPrice: z.number().min(0),
  quotedPrice: z.number().min(0),
  salePrice: z.number().min(0),
  receivedPrice: z.number().min(0),
});
const invoiceStatus = z
  .enum(['draft', 'processing', 'delivered', 'returned'])
  .default('draft');
export type InvoiceStatus = z.infer<typeof invoiceStatus>;
export const invoiceSchema = z.object({
  id: z.string().optional(), // Added and made optional for upsert
  invoiceNumber: z.number().positive(),
  companyId: z.uuidv4(),
  clientId: z.uuidv4(),
  locationId: z.uuidv4(),
  receivedAmount: z.number().positive().optional().nullable(),
  dateOfDelivery: z.date(),
  dateOfInvoice: z.date(),
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

interface Statuses extends Option {
  color?: string;
}
export const statuses: Statuses[] = [
  { value: 'draft' },
  { value: 'processing', color: 'yellow' },
  { value: 'delivered', color: 'blue' },
  { value: 'delivery_acknowledged', color: 'teal' },
  { value: 'paid', color: 'green' },
];
