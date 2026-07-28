import { db } from '$lib/server/db';
import { Invoices } from '$lib/server/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getStartOfMonth, sqlYear, sqlMonth, sqlYearMonth } from '../helpers';

export async function load() {
  const monthsBack = 12;
  const startDate = getStartOfMonth(monthsBack - 1);

  const monthlyRevenue = await db
    .select({
      year: sqlYear(Invoices.dateOfInvoice),
      month: sqlMonth(Invoices.dateOfInvoice),
      revenue: sql<number>`COALESCE(SUM(${Invoices.salePrice}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(Invoices)
    .where(
      and(
        eq(Invoices.status, 'paid'),
        gte(Invoices.dateOfInvoice, startDate),
      ),
    )
    .groupBy(sqlYearMonth(Invoices.dateOfInvoice))
    .orderBy(sqlYearMonth(Invoices.dateOfInvoice));

  const yearlyRevenue = await db
    .select({
      year: sqlYear(Invoices.dateOfInvoice),
      revenue: sql<number>`COALESCE(SUM(${Invoices.salePrice}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(Invoices)
    .where(eq(Invoices.status, 'paid'))
    .groupBy(sqlYear(Invoices.dateOfInvoice))
    .orderBy(sqlYear(Invoices.dateOfInvoice));

  const totalRevenue = yearlyRevenue.reduce((sum, r) => sum + r.revenue, 0);

  const avgInvoiceValue = monthlyRevenue.length > 0
    ? monthlyRevenue.reduce((sum, r) => sum + r.revenue, 0) / monthlyRevenue.reduce((sum, r) => sum + r.count, 0)
    : 0;

  return { monthlyRevenue, yearlyRevenue, totalRevenue, avgInvoiceValue };
}
