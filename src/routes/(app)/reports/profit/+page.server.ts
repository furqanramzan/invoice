import { db } from '$lib/server/db';
import { Invoices, LineItems, Products } from '$lib/server/db/schema';
import { and, desc, eq, gte, sql, ne } from 'drizzle-orm';

function getStartOfMonth(monthsAgo: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

export async function load() {
  const monthsBack = 12;
  const startDate = getStartOfMonth(monthsBack - 1);

  const profitByPeriod = await db
    .select({
      year: sql<number>`CAST(strftime('%Y', ${Invoices.dateOfInvoice} / 1000, 'unixepoch') AS INTEGER)`,
      month: sql<number>`CAST(strftime('%m', ${Invoices.dateOfInvoice} / 1000, 'unixepoch') AS INTEGER)`,
      revenue: sql<number>`COALESCE(SUM(${LineItems.salePrice} * ${LineItems.quantity}), 0)`,
      cost: sql<number>`COALESCE(SUM(${LineItems.actualPrice} * ${LineItems.quantity}), 0)`,
      count: sql<number>`COUNT(DISTINCT ${Invoices.id})`,
    })
    .from(LineItems)
    .innerJoin(Invoices, eq(LineItems.invoiceId, Invoices.id))
    .where(
      and(
        ne(Invoices.status, 'draft'),
        gte(Invoices.dateOfInvoice, startDate),
      ),
    )
    .groupBy(
      sql`strftime('%Y-%m', ${Invoices.dateOfInvoice} / 1000, 'unixepoch')`,
    )
    .orderBy(
      sql`strftime('%Y-%m', ${Invoices.dateOfInvoice} / 1000, 'unixepoch')`,
    );

  const productProfit = await db
    .select({
      id: Products.id,
      name: Products.name,
      revenue: sql<number>`COALESCE(SUM(${LineItems.salePrice} * ${LineItems.quantity}), 0)`,
      cost: sql<number>`COALESCE(SUM(${LineItems.actualPrice} * ${LineItems.quantity}), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(${LineItems.quantity}), 0)`,
    })
    .from(LineItems)
    .innerJoin(Products, eq(LineItems.productId, Products.id))
    .innerJoin(Invoices, eq(LineItems.invoiceId, Invoices.id))
    .where(ne(Invoices.status, 'draft'))
    .groupBy(Products.id, Products.name)
    .orderBy(desc(sql`COALESCE(SUM(${LineItems.salePrice} * ${LineItems.quantity}), 0)`))
    .limit(20);

  const invoiceProfit = await db
    .select({
      id: Invoices.id,
      invoiceNumber: Invoices.invoiceNumber,
      revenue: sql<number>`COALESCE(SUM(${LineItems.salePrice} * ${LineItems.quantity}), 0)`,
      cost: sql<number>`COALESCE(SUM(${LineItems.actualPrice} * ${LineItems.quantity}), 0)`,
      status: Invoices.status,
    })
    .from(LineItems)
    .innerJoin(Invoices, eq(LineItems.invoiceId, Invoices.id))
    .where(ne(Invoices.status, 'draft'))
    .groupBy(Invoices.id, Invoices.invoiceNumber, Invoices.status)
    .orderBy(desc(sql`COALESCE(SUM(${LineItems.salePrice} * ${LineItems.quantity}), 0)`))
    .limit(20);

  const totalRevenue = profitByPeriod.reduce((sum, r) => sum + r.revenue, 0);
  const totalCost = profitByPeriod.reduce((sum, r) => sum + r.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return { profitByPeriod, productProfit, invoiceProfit, totalRevenue, totalCost, totalProfit, margin };
}
