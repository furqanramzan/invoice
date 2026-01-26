import z from 'zod';

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
  invoiceNumber: z.string().min(1),
  date: z.iso.date(),
  lineItems: z.array(lineItemSchema),
  status: invoiceStatus,
});
