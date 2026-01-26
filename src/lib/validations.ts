import z from 'zod';

export const itemSchema = z.object({ id: z.uuidv4() });

export const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(255, 'Password must be at most 255 characters long'),
});

export const registerSchema = loginSchema.extend({
  id: z.uuidv4().optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be at most 50 characters long')
    .regex(
      /^[a-zA-Z\s-]+$/,
      'Name must contain only letters, spaces, or hyphens',
    ),
});
export type RegisterSchema = z.infer<typeof registerSchema>;
