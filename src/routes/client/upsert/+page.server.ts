import { db } from '$lib/server/db';
import { clients, locations, type Client } from '$lib/server/db/schema';
import { clientSchema, route, title } from './utils';
import { eq, inArray } from 'drizzle-orm';
import { initForm, redirectTo, validateAction } from '$lib/superforms';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentClient: Client | undefined;

  if (id) {
    currentClient = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: { locations: true },
    });

    if (!currentClient) {
      return redirectTo(route.list, event, `${title.singular} not found!`);
    }
  }

  const form = await initForm(
    clientSchema,
    currentClient ?? { locations: [{ address: '' }] },
  );

  return { form, currentClient };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, clientSchema);
    if (!form.valid) return form.error;

    const { locations: locationsEntry, ...clientData } = form.data;
    let { id } = form.data;

    await db.transaction(async (tx) => {
      if (id) {
        await tx.update(clients).set(clientData).where(eq(clients.id, id));
      } else {
        const [client] = await tx
          .insert(clients)
          .values(clientData)
          .returning({ id: clients.id });
        id = client.id;
      }

      const newLocations = locationsEntry.filter((x) => !x.id);
      const updateLocations = locationsEntry.filter((x) => x.id && !x.deleted);
      const deleteLocations = locationsEntry
        .filter((x) => x.deleted)
        .map((x) => x.id || 0);
      console.log(deleteLocations);

      if (newLocations.length) {
        await tx
          .insert(locations)
          .values(newLocations.map((x) => ({ ...x, clientId: id || 0 })));
      }
      if (updateLocations.length) {
        await Promise.all(
          updateLocations.map((location) =>
            tx
              .update(locations)
              .set(location)
              .where(eq(locations.id, location.id || 0)),
          ),
        );
      }
      if (deleteLocations.length) {
        await tx
          .delete(locations)
          .where(inArray(locations.id, deleteLocations))
          .returning({ id: locations.id });
      }
    });

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
