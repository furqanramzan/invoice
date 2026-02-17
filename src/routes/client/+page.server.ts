import { db } from '$lib/server/db';
import { Clients, Invoices } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';
import { deleteSchema } from '$lib/validations.js';

export async function load(event) {
  const form = await initForm(deleteSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allClients, [{ count: totalClients }]] = await Promise.all([
    db.query.Clients.findMany({
      limit,
      offset,
      orderBy: desc(Clients.createdAt),
    }),
    db.select({ count: count() }).from(Clients),
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

    const associated = await db.query.Invoices.findFirst({
      where: eq(Invoices.clientId, form.data.id),
      columns: { id: true },
    });
    if (associated) {
      return sendMessage(form, 'Cannot delete: linked to invoices!', 'error');
    }

    await db.delete(Clients).where(eq(Clients.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
