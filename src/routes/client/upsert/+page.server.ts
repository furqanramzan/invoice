import { db } from '$lib/server/db';
import { clients, type Client } from '$lib/server/db/schema';
import { clientSchema, route, title } from './utils';
import { eq } from 'drizzle-orm';
import { initForm, redirectTo, validateAction } from '$lib/superforms';

export const load = async (event) => {
  const id = event.url.searchParams.get('id');
  let currentClient: Client | undefined;

  if (id) {
    currentClient = await db.query.clients.findFirst({
      where: eq(clients.id, id),
    });

    if (!currentClient) {
      return redirectTo(route.list, event, `${title.singular} not found!`);
    }
  }

  const form = await initForm(clientSchema, currentClient ?? undefined);

  return { form, currentClient };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, clientSchema);
    if (!form.valid) return form.error;

    const { id, ...clientData } = form.data;

    if (id) {
      await db.update(clients).set(clientData).where(eq(clients.id, id));
    } else {
      await db.insert(clients).values(clientData);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
