DROP INDEX "invoices_invoice_number_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `invoices` ALTER COLUMN "total" TO "total" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `line_items` ALTER COLUMN "cost_price" TO "cost_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `line_items` ALTER COLUMN "unit_price" TO "unit_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `line_items` ALTER COLUMN "total" TO "total" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ALTER COLUMN "cost_price" TO "cost_price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ALTER COLUMN "unit_price" TO "unit_price" integer NOT NULL;