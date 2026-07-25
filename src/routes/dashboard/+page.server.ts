import { db } from '$lib/server/db';
import {
  Expenses,
  Invoices,
  Products,
  Purchases,
} from '$lib/server/db/schema';
import { LOW_STOCK_THRESHOLD } from '$env/static/private';
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  sql,
} from 'drizzle-orm';

const lowStockThreshold = Number(LOW_STOCK_THRESHOLD) || 5;

function getMonthBounds() {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  );
  return { startOfMonth, startOfNextMonth, now };
}

export async function load() {
  const { startOfMonth, startOfNextMonth, now } = getMonthBounds();

  const unpaidStatuses = [
    'processing',
    'delivered',
    'delivery_acknowledged',
  ];

  const [
    monthlyRevenueResult,
    outstandingResult,
    overdueResult,
    lowStockResult,
    recentInvoices,
    recentExpenses,
    recentPurchases,
    chartInvoices,
    lowStockProducts,
  ] = await Promise.all([
    db
      .select({
        value: sql<number>`COALESCE(SUM(${Invoices.salePrice}), 0)`,
      })
      .from(Invoices)
      .where(
        and(
          eq(Invoices.status, 'paid'),
          gte(Invoices.dateOfInvoice, startOfMonth),
          lt(Invoices.dateOfInvoice, startOfNextMonth),
        ),
      ),
    db
      .select({
        value: sql<number>`COALESCE(SUM(${Invoices.salePrice} - COALESCE(${Invoices.receivedAmount}, 0)), 0)`,
      })
      .from(Invoices)
      .where(inArray(Invoices.status, unpaidStatuses)),
    db
      .select({ count: count() })
      .from(Invoices)
      .where(
        and(
          inArray(Invoices.status, unpaidStatuses),
          lt(Invoices.dateOfDelivery, now),
        ),
      ),
    db
      .select({ count: count() })
      .from(Products)
      .where(
        and(
          gt(Products.stock, 0),
          lte(Products.stock, lowStockThreshold),
        ),
      ),
    db.query.Invoices.findMany({
      orderBy: desc(Invoices.createdAt),
      limit: 10,
      columns: {
        id: true,
        invoiceNumber: true,
        salePrice: true,
        status: true,
        createdAt: true,
      },
    }),
    db.query.Expenses.findMany({
      orderBy: desc(Expenses.createdAt),
      limit: 10,
      columns: {
        id: true,
        title: true,
        amount: true,
        createdAt: true,
      },
    }),
    db.query.Purchases.findMany({
      orderBy: desc(Purchases.createdAt),
      limit: 10,
      columns: {
        id: true,
        purchaseNumber: true,
        status: true,
        createdAt: true,
      },
      with: {
        items: {
          columns: { unitPrice: true, quantity: true },
        },
      },
    }),
    db.query.Invoices.findMany({
      where: and(
        eq(Invoices.status, 'paid'),
        gte(Invoices.dateOfInvoice, startOfMonth),
        lt(Invoices.dateOfInvoice, startOfNextMonth),
      ),
      columns: { dateOfInvoice: true, salePrice: true },
    }),
    db.query.Products.findMany({
      where: and(
        gt(Products.stock, 0),
        lte(Products.stock, lowStockThreshold),
      ),
      orderBy: [desc(Products.stock)],
      columns: {
        id: true,
        name: true,
        stock: true,
        salePrice: true,
      },
    }),
  ]);

  const monthlyRevenue =
    monthlyRevenueResult[0]?.value ?? 0;
  const outstanding = outstandingResult[0]?.value ?? 0;
  const overdueCount = overdueResult[0]?.count ?? 0;
  const lowStockCount = lowStockResult[0]?.count ?? 0;

  const daysInMonth = now.getDate();
  const dailyRevenue: number[] = new Array(daysInMonth).fill(0);

  for (const inv of chartInvoices) {
    const day = inv.dateOfInvoice.getDate();
    dailyRevenue[day - 1] += inv.salePrice;
  }

  type ActivityItem = {
    type: 'invoice' | 'expense' | 'purchase';
    id: number;
    label: string;
    amount: number;
    status?: string;
    createdAt: Date;
  };

  const activity: ActivityItem[] = [
    ...recentInvoices.map((inv) => ({
      type: 'invoice' as const,
      id: inv.id,
      label: `Invoice #${inv.invoiceNumber}`,
      amount: inv.salePrice,
      status: inv.status,
      createdAt: inv.createdAt,
    })),
    ...recentExpenses.map((exp) => ({
      type: 'expense' as const,
      id: exp.id,
      label: exp.title,
      amount: exp.amount,
      createdAt: exp.createdAt,
    })),
    ...recentPurchases.map((pch) => ({
      type: 'purchase' as const,
      id: pch.id,
      label: `Purchase #${pch.purchaseNumber}`,
      amount: (pch.items ?? []).reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
      status: pch.status,
      createdAt: pch.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .slice(0, 10);

  return {
    monthlyRevenue,
    outstanding,
    overdueCount,
    lowStockCount,
    dailyRevenue,
    activity,
    lowStockProducts,
    lowStockThreshold,
  };
}
