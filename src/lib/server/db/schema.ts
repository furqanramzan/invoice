import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const user = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey(),
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
  userId: integer('user_id', { mode: 'number' })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  actualPrice: integer('actual_price').notNull(),
  quotedPrice: integer('quoted_price').notNull(),
  salePrice: integer('sale_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const invoices = sqliteTable('invoices', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id', { mode: 'number' })
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  clientId: integer('client_id', { mode: 'number' })
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  locationId: integer('location_id', { mode: 'number' })
    .notNull()
    .references(() => locations.id, { onDelete: 'cascade' }),
  invoiceNumber: integer('invoice_number').notNull(),
  dateOfDelivery: integer('date_of_delivery', { mode: 'timestamp' }).notNull(),
  dateOfInvoice: integer('date_of_invoice', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('draft'),
  actualPrice: integer('actual_price').notNull(),
  quotedPrice: integer('quoted_price').notNull(),
  salePrice: integer('sale_price').notNull(),
  receivedAmount: integer('received_amount'),
  files: text('files', { mode: 'json' }).$type<
    Array<{ url: string; name: string; deleted?: boolean }>
  >(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const invoicesRelations = relations(invoices, ({ many, one }) => ({
  lineItems: many(lineItems),
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

export const lineItems = sqliteTable('line_items', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  invoiceId: integer('invoice_id', { mode: 'number' })
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id', { mode: 'number' })
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  actualPrice: integer('actual_price').notNull(),
  quotedPrice: integer('quoted_price').notNull(),
  salePrice: integer('sale_price').notNull(),
  receivedPrice: integer('received_price').notNull(),
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
  id: integer('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  office: text('office').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  logoUrl: text('logo_url'),
  printLayout: text('print_layout').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const clients = sqliteTable('clients', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  invoiceNumberInitial: text('inoive_number_initial').notNull(),
  attention: text('attention'),
  email: text('email'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const locations = sqliteTable('locations', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  address: text('address').notNull(),
  clientId: integer('client_id', { mode: 'number' })
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  client: one(clients, {
    fields: [locations.clientId],
    references: [clients.id],
  }),
}));

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Client = typeof clients.$inferSelect;
