import { db } from '$lib/server/db';
import { Suppliers } from '$lib/server/db/schema';
import { supplierSchema, route, title } from './utils';
import { eq } from 'drizzle-orm';
import {
  initForm,
  redirectTo,
  validateAction,
} from '$lib/superforms.js';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentSupplier = null;

  if (id) {
    currentSupplier = await db.query.Suppliers.findFirst({
      where: eq(Suppliers.id, id),
    });

    if (!currentSupplier) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not exists!`,
      );
    }
  }

  const { companies } = await event.parent();

  const form = await initForm(
    supplierSchema,
    currentSupplier
      ? {
          ...currentSupplier,
          email: currentSupplier.email ?? undefined,
          phone: currentSupplier.phone ?? undefined,
          address: currentSupplier.address ?? undefined,
          openingBalance: currentSupplier.openingBalance ?? 0,
        }
      : { companyId: companies.at(0)?.id },
  );

  return { form, currentSupplier, companies };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, supplierSchema);
    if (!form.valid) return form.error;

    const { id, ...data } = form.data;

    if (id) {
      await db
        .update(Suppliers)
        .set(data)
        .where(eq(Suppliers.id, Number(id)));
    } else {
      await db.insert(Suppliers).values(data);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
