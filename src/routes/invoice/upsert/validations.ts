import z from 'zod';

export const lineItemSchema = z.object({
  id: z.string().optional(), // Made optional for upsert
  productId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().gt(0),
  costPrice: z.number().gt(0),
  unitPrice: z.number().gt(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(), // Added and made optional for upsert
  store: z.string().min(1),
  invoiceNumber: z.string().min(1),
  date: z.date().optional(),
  products: z.array(lineItemSchema).min(1),
});
