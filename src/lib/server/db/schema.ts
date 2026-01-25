import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const user = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
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
  name: text('name').notNull(),
  costPrice: real('cost_price').notNull(),
  unitPrice: real('unit_price').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
});

export const productsRelations = relations(products, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const invoices = sqliteTable('invoices', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: text('invoice_number').notNull().unique(),
  store: text('store'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  total: real('total').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  status: text('status').notNull().default('draft'),
});

export const invoicesRelations = relations(invoices, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const lineItems = sqliteTable('line_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quantity: integer('quantity').notNull(),
  costPrice: real('cost_price').notNull(),
  unitPrice: real('unit_price').notNull(),
  total: real('total').notNull(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => invoices.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
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

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Product = typeof products.$inferSelect;
