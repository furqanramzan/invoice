import { db } from '$lib/server/db';
import { Suppliers } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import {
  initForm,
  sendMessage,
  validateAction,
} from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';

export async function load(event) {
  const form = await initForm(itemSchema);

  const { page, offset, limit } = getPaginationData(event);

  const companyId = Number(
    event.url.searchParams.get('companyId'),
  );

  const where = companyId
    ? eq(Suppliers.companyId, companyId)
    : undefined;

  const [allSuppliers, [{ count: totalSuppliers }]] =
    await Promise.all([
      db.query.Suppliers.findMany({
        limit,
        offset,
        orderBy: desc(Suppliers.createdAt),
        where,
        with: { company: { columns: { name: true } } },
      }),
      db.select({ count: count() }).from(Suppliers).where(where),
    ]);

  return {
    form,
    suppliers: allSuppliers,
    currentPage: page,
    totalPages: Math.ceil(totalSuppliers / limit),
    selectedCompanyId: companyId,
  };
}

export const actions = {
  async default(event) {
    const form = await validateAction(event, itemSchema);
    if (!form.valid) return form.error;

    await db
      .delete(Suppliers)
      .where(eq(Suppliers.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
