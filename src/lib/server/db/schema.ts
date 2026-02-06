import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const user = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const session = sqliteTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const products = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => user.id),
  name: text('name').notNull(),
  costPrice: integer('cost_price').notNull(),
  unitPrice: integer('unit_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const invoices = sqliteTable('invoices', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  invoiceNumber: integer('invoice_number').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('draft'),
  store: text('store'),
  total: integer('total').notNull(),
  files: text('files', { mode: 'json' }).$type<
    Array<{ url: string; name: string; deleted?: boolean }>
  >(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const invoicesRelations = relations(invoices, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const lineItems = sqliteTable('line_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => invoices.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  costPrice: integer('cost_price').notNull(),
  unitPrice: integer('unit_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [lineItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [lineItems.productId],
    references: [products.id],
  }),
}));

export const companies = sqliteTable('companies', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  printLayout: text('print_layout'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Company = typeof companies.$inferSelect;
