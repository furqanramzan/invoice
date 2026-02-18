import z from 'zod';
import { resolve } from '$app/paths';

export const title = { singular: 'Expense', plural: 'Expenses' };

export const route = {
  list: resolve('/expense'),
  upsert: resolve('/expense/upsert'),
};

export const expenseSchema = z.object({
  id: z.number().positive().optional(),
  title: z.string().min(1, { message: 'Title is required' }),
  amount: z.number().min(0, { message: 'Amount cannot be negative' }),
  date: z.date(),
  description: z.string().optional().nullable(),
});
