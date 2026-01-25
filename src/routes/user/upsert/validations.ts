import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().optional(),
  email: z.email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(255, 'Password must be at most 255 characters long')
    .optional(), // Optional for updates, but will be refined in actions for creation
});

export type UserSchema = typeof userSchema;
