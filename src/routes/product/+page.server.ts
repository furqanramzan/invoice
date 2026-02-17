import { db } from '$lib/server/db';
import { Products, LineItems } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';

export async function load(event) {
  const form = await initForm(itemSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allProducts, [{ count: totalProducts }]] = await Promise.all([
    db.query.Products.findMany({
      limit,
      offset,
      orderBy: desc(Products.createdAt),
    }),
    db.select({ count: count() }).from(Products),
  ]);

  return {
    form,
    products: allProducts,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
  };
}

export const actions = {
  async default(event) {
    console.log('nme');

    const form = await validateAction(event, itemSchema);
    console.log(form);

    if (!form.valid) return form.error;

    // Check if the product is associated with any line items
    const associatedLineItems = await db
      .select()
      .from(LineItems)
      .where(eq(LineItems.productId, form.data.id))
      .limit(1);
    if (associatedLineItems.length > 0) {
      return sendMessage(form, 'Cannot delete: linked to invoices!', 'error');
    }

    await db.delete(Products).where(eq(Products.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
