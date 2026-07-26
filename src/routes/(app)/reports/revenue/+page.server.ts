import { db } from '$lib/server/db';
import { Invoices, LineItems } from '$lib/server/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

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

  const monthlyRevenue = await db
    .select({
      year: sql<number>`CAST(strftime('%Y', ${Invoices.dateOfInvoice} / 1000, 'unixepoch') AS INTEGER)`,
      month: sql<number>`CAST(strftime('%m', ${Invoices.dateOfInvoice} / 1000, 'unixepoch') AS INTEGER)`,
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
    .groupBy(
      sql`strftime('%Y-%m', ${Invoices.dateOfInvoice} / 1000, 'unixepoch')`,
    )
    .orderBy(
      sql`strftime('%Y-%m', ${Invoices.dateOfInvoice} / 1000, 'unixepoch')`,
    );

  const yearlyRevenue = await db
    .select({
      year: sql<number>`CAST(strftime('%Y', ${Invoices.dateOfInvoice} / 1000, 'unixepoch') AS INTEGER)`,
      revenue: sql<number>`COALESCE(SUM(${Invoices.salePrice}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(Invoices)
    .where(eq(Invoices.status, 'paid'))
    .groupBy(
      sql`strftime('%Y', ${Invoices.dateOfInvoice} / 1000, 'unixepoch')`,
    )
    .orderBy(
      sql`strftime('%Y', ${Invoices.dateOfInvoice} / 1000, 'unixepoch')`,
    );

  const totalRevenue = yearlyRevenue.reduce((sum, r) => sum + r.revenue, 0);

  const avgInvoiceValue = monthlyRevenue.length > 0
    ? monthlyRevenue.reduce((sum, r) => sum + r.revenue, 0) / monthlyRevenue.reduce((sum, r) => sum + r.count, 0)
    : 0;

  return { monthlyRevenue, yearlyRevenue, totalRevenue, avgInvoiceValue };
}
