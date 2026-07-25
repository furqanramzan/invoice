import { db } from '$lib/server/db';
import { Products } from '$lib/server/db/schema';
import { LOW_STOCK_THRESHOLD } from '$env/static/private';
import { and, asc, count, eq, gt, lte } from 'drizzle-orm';
import { getPaginationData } from '$lib/utils.js';

const lowStockThreshold = Number(LOW_STOCK_THRESHOLD) || 5;

export async function load(event) {
  const { page, offset, limit } = getPaginationData(event);

  const companyId = Number(
    event.url.searchParams.get('companyId'),
  );

  const companyFilter = companyId
    ? eq(Products.companyId, companyId)
    : undefined;

  const [
    products,
    [{ count: totalProducts }],
    [{ count: inStock }],
    [{ count: lowStock }],
    [{ count: outOfStock }],
  ] = await Promise.all([
    db.query.Products.findMany({
      limit,
      offset,
      orderBy: [asc(Products.stock), asc(Products.name)],
      where: companyFilter,
      with: { company: { columns: { name: true } } },
    }),
    db
      .select({ count: count() })
      .from(Products)
      .where(and(companyFilter)),
    db
      .select({ count: count() })
      .from(Products)
      .where(and(companyFilter, gt(Products.stock, 0))),
    db
      .select({ count: count() })
      .from(Products)
      .where(
        and(
          companyFilter,
          gt(Products.stock, 0),
          lte(Products.stock, lowStockThreshold),
        ),
      ),
    db
      .select({ count: count() })
      .from(Products)
      .where(and(companyFilter, eq(Products.stock, 0))),
  ]);

  return {
    products,
    stats: { totalProducts, inStock, lowStock, outOfStock },
    lowStockThreshold,
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
    selectedCompanyId: companyId,
  };
}
