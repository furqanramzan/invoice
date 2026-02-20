import z from 'zod';

export const itemSchema = z.object({
  id: z.number().positive(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(255, 'Password must be at most 255 characters long'),
});

export const registerSchema = loginSchema.extend({
  id: z.number().positive().optional(),
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

export const deleteSchema = z.object({
  id: z.number().positive(),
});

export const emptySchema = z.object({});

export const multiUrlSchema = z
  .object({
    url: z.url(),
    name: z.string(),
    deleted: z.boolean().optional(),
  })
  .array()
  .optional()
  .nullable();
export const multiFileSchema = z
  .instanceof(File, { message: 'Please upload a file.' })
  .refine((f) => f.size < 100_000_000, 'Max 100 kB upload size.')
  .array()
  .optional();
