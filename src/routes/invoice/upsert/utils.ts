import z from 'zod';
import { resolve } from '$app/paths';
import { multiUrlSchema, multiFileSchema } from '$lib/validations';

export const title = { singular: 'Invoice', plural: 'Invoices' };

export const route = {
  list: resolve('/invoice'),
  upsert: resolve('/invoice/upsert'),
};

export const lineItemSchema = z.object({
  id: z.number().positive().optional(), // Made optional for upsert
  productId: z.number().positive().optional(),
  name: z.string().min(1),
  remarks: z.string().optional().nullable(),
  quantity: z.number().int().gt(0),
  actualPrice: z.number().min(0),
  quotedPrice: z.number().min(0),
  salePrice: z.number().min(0),
  receivedPrice: z.number().min(0),
});
const invoiceStatus = z
  .enum([
    'draft',
    'processing',
    'delivered',
    'delivery_acknowledged',
    'disputed',
    'paid',
  ])
  .default('draft');
export type InvoiceStatus = z.infer<typeof invoiceStatus>;
export const invoiceSchema = z.object({
  id: z.number().positive().optional(), // Added and made optional for upsert
  invoiceNumber: z.number().positive(),
  companyId: z.coerce.number().positive(),
  clientId: z.coerce.number().positive(),
  locationId: z.coerce.number().positive(),
  remarks: z.string().optional().nullable(),
  receivedAmount: z.number().positive().optional().nullable(),
  dateOfDelivery: z.date(),
  dateOfInvoice: z.date(),
  lineItems: z.array(lineItemSchema),
  status: invoiceStatus,
  attachmentUrls: multiUrlSchema,
  attachments: multiFileSchema,
});

export const statuses = [
  { value: 'draft', color: 'purple' },
  { value: 'processing', color: 'yellow' },
  { value: 'delivered', color: 'blue' },
  { value: 'delivery_acknowledged', color: 'teal' },
  { value: 'disputed', color: 'red' },
  { value: 'paid', color: 'green' },
];
