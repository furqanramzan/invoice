import fs from 'fs/promises';
import { eq } from 'drizzle-orm';
import path from 'path';
import { db } from '$lib/server/db';
import {
  companies,
  clients,
  invoices as invoicesTable,
  lineItems,
  locations,
  products,
} from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export async function POST() {
  const [firstCompany] = await db.select().from(companies).limit(1);
  if (!firstCompany) {
    return json({ error: 'No company found in database' });
  }

  const [firstClient] = await db.select().from(clients).limit(1);
  if (!firstClient) {
    return json({ error: 'No client found in database.' });
  }
  const [firstLocation] = await db
    .select()
    .from(locations)
    .where(eq(locations.clientId, firstClient.id))
    .limit(1);
  if (!firstLocation) {
    return json({ error: 'No location found for the first client.' });
  }
  interface Invoice {
    location?: string;
    invoiceNumber: number;
    dateOfDelivery: Date;
    dateOfInvoice: Date;
    lineItems: LineItem[];
    receivedAmount?: number;
  }

  interface LineItem {
    name: string;
    quantity: number;
    actualPrice: number;
    salePrice: number;
    quotedPrice: number;
  }
  const filePath = path.resolve(process.cwd(), 'invoices.json');
  let invoices: Array<Invoice> = JSON.parse(
    await fs.readFile(filePath, 'utf-8'),
  );
  invoices = invoices.map((x) => ({
    ...x,
    dateOfDelivery: new Date(x.dateOfDelivery),
    dateOfInvoice: new Date(x.dateOfInvoice),
  }));

  const existingProducts = await db.select().from(products);
  const productsToUpdate: Array<{
    id: number;
    actualPrice: number;
    quotedPrice: number;
    salePrice: number;
  }> = [];

  await db.transaction(async (tx) => {
    for (const invoice of invoices.filter((x) => x.lineItems.length)) {
      let locationId = firstLocation.id;
      if (invoice.location) {
        const foundLocation = await tx.query.locations.findFirst({
          where: eq(locations.address, invoice.location),
        });
        if (foundLocation) {
          locationId = foundLocation.id;
        } else {
          const [newLoc] = await tx
            .insert(locations)
            .values({
              address: invoice.location,
              clientId: firstClient.id,
            })
            .returning({ id: locations.id });

          locationId = newLoc.id;
        }
      }

      let totalActualPrice = 0;
      let totalQuotedPrice = 0;
      let totalSalePrice = 0;

      const lineItemsToInsertForInvoice: Array<
        Omit<typeof lineItems.$inferInsert, 'invoiceId'>
      > = [];

      for (const item of invoice.lineItems) {
        let currentProduct = existingProducts.find((p) => p.name === item.name);

        if (currentProduct) {
          if (
            currentProduct.actualPrice !== item.actualPrice ||
            currentProduct.quotedPrice !== item.quotedPrice ||
            currentProduct.salePrice !== item.salePrice
          ) {
            productsToUpdate.push({
              id: currentProduct.id,
              actualPrice: item.actualPrice,
              quotedPrice: item.quotedPrice,
              salePrice: item.salePrice,
            });
          }
        } else {
          const [newProduct] = await tx
            .insert(products)
            .values({
              name: item.name,
              actualPrice: item.actualPrice,
              quotedPrice: item.quotedPrice,
              salePrice: item.salePrice,
              createdAt: new Date(),
            })
            .returning({ id: products.id });
          if (!newProduct) {
            throw new Error('Failed to insert new product');
          }
          // To ensure type compatibility with Product type from schema
          const tempProduct: typeof products.$inferSelect = {
            id: newProduct.id,
            name: item.name,
            actualPrice: item.actualPrice,
            quotedPrice: item.quotedPrice,
            salePrice: item.salePrice,
            createdAt: new Date(),
          };
          currentProduct = tempProduct;
          existingProducts.push(currentProduct); // Add to existingProducts to avoid re-creating in the same batch
        }

        if (!currentProduct) {
          throw new Error('currentProduct is undefined after creation attempt');
        }

        lineItemsToInsertForInvoice.push({
          productId: currentProduct.id,
          quantity: item.quantity,
          actualPrice: item.actualPrice || 0,
          quotedPrice: item.quotedPrice || 0,
          salePrice: item.salePrice || 0,
          receivedPrice: 0,
        });

        totalActualPrice += item.actualPrice * item.quantity;
        totalQuotedPrice += item.quotedPrice * item.quantity;
        totalSalePrice += item.salePrice * item.quantity;
      }

      const [newInvoice] = await tx
        .insert(invoicesTable)
        .values({
          companyId: firstCompany.id,
          clientId: firstClient.id,
          locationId: locationId,
          invoiceNumber: invoice.invoiceNumber,
          dateOfDelivery: invoice.dateOfDelivery,
          dateOfInvoice: invoice.dateOfInvoice,
          status: 'delivery_acknowledged',
          actualPrice: totalActualPrice,
          quotedPrice: totalQuotedPrice,
          salePrice: totalSalePrice,
          receivedAmount: invoice.receivedAmount,
        })
        .returning({ id: invoicesTable.id });

      if (!newInvoice) {
        throw new Error('Failed to insert new invoice');
      }

      await tx.insert(lineItems).values(
        lineItemsToInsertForInvoice.map((item) => ({
          ...item,
          invoiceId: newInvoice.id,
        })),
      );
    }

    for (const product of productsToUpdate) {
      await tx
        .update(products)
        .set({
          actualPrice: product.actualPrice,
          quotedPrice: product.quotedPrice,
          salePrice: product.salePrice,
        })
        .where(eq(products.id, product.id));
    }
  });

  return json({ success: true });
}
