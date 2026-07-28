import { db } from '$lib/server/db';
import {
  Products,
  PurchaseItems,
  Purchases,
} from '$lib/server/db/schema';
import { purchaseSchema, route, title } from './utils';
import { eq, sql } from 'drizzle-orm';
import { convertToCents } from '$lib/utils.js';
import {
  initForm,
  redirectTo,
  validateAction,
} from '$lib/superforms.js';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentPurchase = null;

  if (id) {
    currentPurchase = await db.query.Purchases.findFirst({
      where: eq(Purchases.id, id),
      with: { items: { with: { product: true } } },
    });

    if (!currentPurchase) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not exists!`,
      );
    }
  }

  const { companies } = await event.parent();
  const [suppliers, allProducts] = await Promise.all([
    db.query.Suppliers.findMany({
      with: { company: { columns: { name: true } } },
    }),
    db.query.Products.findMany(),
  ]);

  const defaultCompanyId = companies.at(0)?.id;

  const purchaseNumbers = await db
    .select({
      companyId: Purchases.companyId,
      purchaseNumber: sql<number>`max(${Purchases.purchaseNumber})`,
    })
    .from(Purchases)
    .groupBy(Purchases.companyId);
  const purchaseNumber =
    (purchaseNumbers.find(
      (x) => x.companyId === defaultCompanyId,
    )?.purchaseNumber || 0) + 1;

  const form = await initForm(
    purchaseSchema,
    currentPurchase
      ? {
          ...currentPurchase,
          status: currentPurchase.status as 'pending' | 'partial' | 'paid' | 'cancelled',
          notes: currentPurchase.notes ?? undefined,
          items: currentPurchase.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice / 100,
          })),
        }
      : {
          purchaseNumber,
          companyId: defaultCompanyId,
          date: new Date(),
          status: 'pending',
          items: [],
        },
  );

  return { form, currentPurchase, companies, suppliers, products: allProducts };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, purchaseSchema);
    if (!form.valid) return form.error;

    const { id, items, ...purchaseData } = form.data;

    await db.transaction(async (tx) => {
      if (id) {
        const oldItems = await tx.query.PurchaseItems.findMany({
          where: eq(PurchaseItems.purchaseId, id),
        });

        for (const oldItem of oldItems) {
          await tx
            .update(Products)
            .set({
              stock: sql`${Products.stock} - ${oldItem.quantity}`,
            })
            .where(eq(Products.id, oldItem.productId));
        }

        await tx
          .delete(PurchaseItems)
          .where(eq(PurchaseItems.purchaseId, id));

        await tx
          .update(Purchases)
          .set({
            ...purchaseData,
            date: new Date(purchaseData.date),
          })
          .where(eq(Purchases.id, id));
      } else {
        const [newPurchase] = await tx
          .insert(Purchases)
          .values({
            ...purchaseData,
            date: new Date(purchaseData.date),
          })
          .returning({ id: Purchases.id });
        form.data.id = newPurchase.id;
      }

      if (items.length) {
        await tx.insert(PurchaseItems).values(
          items.map((item) => ({
            purchaseId: form.data.id!,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: convertToCents(item.unitPrice),
          })),
        );

        for (const item of items) {
          await tx
            .update(Products)
            .set({
              stock: sql`${Products.stock} + ${item.quantity}`,
            })
            .where(eq(Products.id, item.productId));
        }
      }
    });

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
