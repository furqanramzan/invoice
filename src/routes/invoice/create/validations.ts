import z from 'zod';

export const lineItemSchema = z.object({
  id: z.uuidv4(),
  productId: z.uuidv4().optional(),
  name: z.string().min(1),
  quantity: z.number().int().gt(0),
  costPrice: z.number().gt(0),
  unitPrice: z.number().gt(0),
});

export const invoiceSchema = z.object({
  store: z.string().min(1),
  invoiceNumber: z.string().min(1),
  date: z.date().optional(),
  products: z.array(lineItemSchema).min(1),
});
