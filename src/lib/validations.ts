import z from 'zod';

export const itemSchema = z.object({ id: z.uuidv4() });
