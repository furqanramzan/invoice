import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { productSchema, route, title } from './utils';
import { eq } from 'drizzle-orm';
import { initForm, redirectTo, validateAction } from '$lib/superforms.js';
import { convertCents, convertToCents } from '$lib/utils.js';

export const load = async (event) => {
  const id = event.url.searchParams.get('id');
  let currentProduct = null;

  if (id) {
    currentProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!currentProduct) {
      return redirectTo(route.list, event, `${title.singular} not exists!`);
    }
  }

  const form = await initForm(
    productSchema,
    currentProduct
      ? {
          ...currentProduct,
          actualPrice: convertCents(currentProduct.actualPrice / 100),
          quotedPrice: convertCents(currentProduct.quotedPrice / 100),
          salePrice: convertCents(currentProduct.salePrice / 100),
        }
      : undefined,
  );

  return { form, currentProduct };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, productSchema);
    if (!form.valid) return form.error;

    const { id, ...data } = form.data;

    const productData = {
      ...data,
      actualPrice: convertToCents(data.actualPrice * 100),
      quotedPrice: convertCents(data.quotedPrice * 100),
      salePrice: convertCents(data.salePrice * 100),
    };

    if (id) {
      await db.update(products).set(productData).where(eq(products.id, id));
    } else {
      await db.insert(products).values(productData);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
