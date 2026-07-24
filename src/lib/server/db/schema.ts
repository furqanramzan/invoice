import {
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const Users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const Sessions = sqliteTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: integer('user_id', { mode: 'number' })
    .notNull()
    .references(() => Users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', {
    mode: 'timestamp',
  }).notNull(),
});

export const Products = sqliteTable('products', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id', { mode: 'number' })
    .notNull()
    .default(1)
    .references(() => Companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  actualPrice: integer('actual_price').notNull(),
  quotedPrice: integer('quoted_price').notNull(),
  salePrice: integer('sale_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const ProductsRelations = relations(
  Products,
  ({ many, one }) => ({
    lineItems: many(LineItems),
    company: one(Companies, {
      fields: [Products.companyId],
      references: [Companies.id],
    }),
  }),
);

export const Invoices = sqliteTable('invoices', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id', { mode: 'number' })
    .notNull()
    .references(() => Companies.id, {
      onDelete: 'cascade',
    }),
  clientId: integer('client_id', { mode: 'number' })
    .notNull()
    .references(() => Clients.id, { onDelete: 'cascade' }),
  locationId: integer('location_id', { mode: 'number' })
    .notNull()
    .references(() => Locations.id, {
      onDelete: 'cascade',
    }),
  invoiceNumber: integer('invoice_number').notNull(),
  dateOfDelivery: integer('date_of_delivery', {
    mode: 'timestamp',
  }).notNull(),
  dateOfInvoice: integer('date_of_invoice', {
    mode: 'timestamp',
  }).notNull(),
  status: text('status').notNull().default('draft'),
  actualPrice: integer('actual_price').notNull(),
  quotedPrice: integer('quoted_price').notNull(),
  salePrice: integer('sale_price').notNull(),
  receivedAmount: integer('received_amount'),
  attachmentUrls: text('attachment_urls', {
    mode: 'json',
  }).$type<
    Array<{ url: string; name: string; deleted?: boolean }>
  >(),
  remarks: text('remarks'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const InvoicesRelations = relations(
  Invoices,
  ({ many, one }) => ({
    lineItems: many(LineItems),
    company: one(Companies, {
      fields: [Invoices.companyId],
      references: [Companies.id],
    }),
    client: one(Clients, {
      fields: [Invoices.clientId],
      references: [Clients.id],
    }),
    location: one(Locations, {
      fields: [Invoices.locationId],
      references: [Locations.id],
    }),
  }),
);

export const LineItems = sqliteTable('line_items', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  invoiceId: integer('invoice_id', { mode: 'number' })
    .notNull()
    .references(() => Invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id', { mode: 'number' })
    .notNull()
    .references(() => Products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  actualPrice: integer('actual_price').notNull(),
  quotedPrice: integer('quoted_price').notNull(),
  salePrice: integer('sale_price').notNull(),
  receivedPrice: integer('received_price').notNull(),
  remarks: text('remarks'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const LineItemsRelations = relations(
  LineItems,
  ({ one }) => ({
    invoice: one(Invoices, {
      fields: [LineItems.invoiceId],
      references: [Invoices.id],
    }),
    product: one(Products, {
      fields: [LineItems.productId],
      references: [Products.id],
    }),
  }),
);

export const Companies = sqliteTable('companies', {
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

export const Clients = sqliteTable('clients', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id', { mode: 'number' })
    .notNull()
    .default(1)
    .references(() => Companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  invoiceNumberInitial: text('inoive_number_initial').notNull(),
  attention: text('attention'),
  email: text('email'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const Locations = sqliteTable('locations', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  address: text('address').notNull(),
  clientId: integer('client_id', { mode: 'number' })
    .notNull()
    .references(() => Clients.id, { onDelete: 'cascade' }),
});

export const CompaniesRelations = relations(
  Companies,
  ({ many }) => ({
    clients: many(Clients),
    products: many(Products),
    expenses: many(Expenses),
  }),
);

export const ClientsRelations = relations(
  Clients,
  ({ many, one }) => ({
    locations: many(Locations),
    company: one(Companies, {
      fields: [Clients.companyId],
      references: [Companies.id],
    }),
  }),
);

export const LocationsRelations = relations(
  Locations,
  ({ one }) => ({
    client: one(Clients, {
      fields: [Locations.clientId],
      references: [Clients.id],
    }),
  }),
);

export const Expenses = sqliteTable('expenses', {
  id: integer('id', { mode: 'number' }).primaryKey(),
  companyId: integer('company_id', { mode: 'number' })
    .notNull()
    .default(1)
    .references(() => Companies.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description'),
  attachmentUrls: text('attachment_urls', {
    mode: 'json',
  }).$type<
    Array<{ url: string; name: string; deleted?: boolean }>
  >(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const ExpensesRelations = relations(
  Expenses,
  ({ one }) => ({
    company: one(Companies, {
      fields: [Expenses.companyId],
      references: [Companies.id],
    }),
  }),
);

export type Sessions = typeof Sessions.$inferSelect;
export type Users = typeof Users.$inferSelect;
export type Product = typeof Products.$inferSelect;
export type ProductInsert = typeof Products.$inferInsert;
export type Company = typeof Companies.$inferSelect;
export type Client = typeof Clients.$inferSelect;
export type Expense = typeof Expenses.$inferSelect;
