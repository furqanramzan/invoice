import { sql } from 'drizzle-orm';
import type { SQLWrapper } from 'drizzle-orm';

export function getStartOfMonth(monthsAgo: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

export function sqlYear(column: SQLWrapper) {
  return sql<number>`CAST(strftime('%Y', ${column}, 'unixepoch') AS INTEGER)`;
}

export function sqlMonth(column: SQLWrapper) {
  return sql<number>`CAST(strftime('%m', ${column}, 'unixepoch') AS INTEGER)`;
}

export function sqlYearMonth(column: SQLWrapper) {
  return sql<string>`strftime('%Y-%m', ${column}, 'unixepoch')`;
}
