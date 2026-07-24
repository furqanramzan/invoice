import { db } from '$lib/server/db';
import { Products } from '$lib/server/db/schema';
import { productSchema, route, title } from './utils';
import { eq } from 'drizzle-orm';
import {
  initForm,
  redirectTo,
  validateAction,
} from '$lib/superforms.js';
import { convertCents, convertToCents } from '$lib/utils.js';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentProduct = null;

  if (id) {
    currentProduct = await db.query.Products.findFirst({
      where: eq(Products.id, id),
    });

    if (!currentProduct) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not exists!`,
      );
    }
  }

  const { companies } = await event.parent();

  const form = await initForm(
    productSchema,
    currentProduct
      ? {
          ...currentProduct,
          actualPrice: convertCents(currentProduct.actualPrice),
          quotedPrice: convertCents(currentProduct.quotedPrice),
          salePrice: convertCents(currentProduct.salePrice),
        }
      : { companyId: companies.at(0)?.id },
  );

  return { form, currentProduct, companies };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, productSchema);
    if (!form.valid) return form.error;

    const { id, ...data } = form.data;

    const productData = {
      ...data,
      actualPrice: convertToCents(data.actualPrice),
      quotedPrice: convertToCents(data.quotedPrice),
      salePrice: convertToCents(data.salePrice),
    };

    if (id) {
      await db
        .update(Products)
        .set(productData)
        .where(eq(Products.id, Number(id)));
    } else {
      await db.insert(Products).values(productData);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
