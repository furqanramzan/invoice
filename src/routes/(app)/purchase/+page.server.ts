import { db } from '$lib/server/db';
import { Purchases } from '$lib/server/db/schema';
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
    ? eq(Purchases.companyId, companyId)
    : undefined;

  const [allPurchases, [{ count: totalPurchases }]] =
    await Promise.all([
      db.query.Purchases.findMany({
        limit,
        offset,
        orderBy: desc(Purchases.createdAt),
        where,
        with: {
          company: { columns: { name: true } },
          supplier: { columns: { name: true } },
          items: {
            columns: { quantity: true, unitPrice: true },
          },
        },
      }),
      db.select({ count: count() }).from(Purchases).where(where),
    ]);

  const purchasesWithTotal = allPurchases.map((purchase) => ({
    ...purchase,
    totalAmount:
      purchase.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ) / 100,
  }));

  return {
    form,
    purchases: purchasesWithTotal,
    currentPage: page,
    totalPages: Math.ceil(totalPurchases / limit),
    selectedCompanyId: companyId,
  };
}

export const actions = {
  async default(event) {
    const form = await validateAction(event, itemSchema);
    if (!form.valid) return form.error;

    await db
      .delete(Purchases)
      .where(eq(Purchases.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
