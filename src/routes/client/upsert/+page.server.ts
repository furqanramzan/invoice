import { db } from '$lib/server/db';
import {
  Clients,
  Invoices,
  Locations,
  type Client,
} from '$lib/server/db/schema';
import { clientSchema, route, title } from './utils';
import { eq, inArray } from 'drizzle-orm';
import {
  initForm,
  redirectTo,
  validateAction,
} from '$lib/superforms';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentClient: Client | undefined;

  if (id) {
    currentClient = await db.query.Clients.findFirst({
      where: eq(Clients.id, id),
      with: { locations: true },
    });

    if (!currentClient) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not found!`,
      );
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

    const { locations: locationsEntry, ...clientData } =
      form.data;
    let { id } = form.data;

    await db.transaction(async (tx) => {
      if (id) {
        await tx
          .update(Clients)
          .set(clientData)
          .where(eq(Clients.id, id));
      } else {
        const [client] = await tx
          .insert(Clients)
          .values(clientData)
          .returning({ id: Clients.id });
        id = client.id;
      }

      const newLocations = locationsEntry.filter((x) => !x.id);
      const updateLocations = locationsEntry.filter(
        (x) => x.id && !x.deleted,
      );
      const deleteLocations = locationsEntry
        .filter((x) => x.deleted)
        .map((x) => x.id || 0);
      if (newLocations.length) {
        await tx.insert(Locations).values(
          newLocations.map((x) => ({
            ...x,
            clientId: id || 0,
          })),
        );
      }
      if (updateLocations.length) {
        await Promise.all(
          updateLocations.map((location) =>
            tx
              .update(Locations)
              .set(location)
              .where(eq(Locations.id, location.id || 0)),
          ),
        );
      }
      if (deleteLocations.length) {
        const associated = await db.query.Invoices.findFirst({
          where: inArray(Invoices.locationId, deleteLocations),
          columns: { id: true },
        });
        if (associated) {
          return redirectTo(
            route.list,
            event,
            'Cannot delete locations: linked to invoices!',
            'error',
          );
        }
        await tx
          .delete(Locations)
          .where(inArray(Locations.id, deleteLocations))
          .returning({ id: Locations.id });
      }
    });

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
