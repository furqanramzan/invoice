import { db } from '$lib/server/db';
import { products, lineItems } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';

export async function load(event) {
  const form = await initForm(itemSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allProducts, totalProducts] = await Promise.all([
    db.query.products.findMany({
      limit,
      offset,
      orderBy: desc(products.createdAt),
    }),
    db.select().from(products),
  ]);

  return {
    form,
    products: allProducts,
    currentPage: page,
    totalPages: Math.ceil(totalProducts.length / limit),
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
      .from(lineItems)
      .where(eq(lineItems.productId, form.data.id))
      .limit(1);
    if (associatedLineItems.length > 0) {
      return sendMessage(form, 'Cannot delete: linked to invoices!', 'error');
    }

    await db.delete(products).where(eq(products.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
