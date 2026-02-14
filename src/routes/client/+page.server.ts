import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';
import { deleteSchema } from '$lib/validations.js';

export async function load(event) {
  const form = await initForm(deleteSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allClients, [{ count: totalClients }]] = await Promise.all([
    db.query.clients.findMany({
      limit,
      offset,
      orderBy: desc(clients.createdAt),
    }),
    db.select({ count: count() }).from(clients),
  ]);

  return {
    form,
    clients: allClients,
    currentPage: page,
    totalPages: Math.ceil(totalClients / limit),
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
