import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';
import z from 'zod';

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function load(event) {
  const form = await initForm(deleteSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allClients, totalClients] = await Promise.all([
    db.query.clients.findMany({
      limit,
      offset,
      orderBy: desc(clients.createdAt),
    }),
    db.select().from(clients),
  ]);

  return {
    form,
    clients: allClients,
    currentPage: page,
    totalPages: Math.ceil(totalClients.length / limit),
  };
}

export const actions = {
  async default(event) {
    const form = await validateAction(event, deleteSchema);

    if (!form.valid) return form.error;

    await db.delete(clients).where(eq(clients.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
