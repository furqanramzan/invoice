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
  const invoicesToInsert: Array<typeof invoicesTable.$inferInsert> = [];
  const lineItemsToInsert: Array<typeof lineItems.$inferInsert> = [];
  const productsToUpdate: Array<{
    id: string;
    actualPrice: number;
    quotedPrice: number;
    salePrice: number;
  }> = [];
  const productsToInsert: Array<typeof products.$inferInsert> = [];

  for (const invoice of invoices.filter((x) => x.lineItems.length)) {
    let locationId = firstLocation.id;
    if (invoice.location) {
      const foundLocation = await db.query.locations.findFirst({
        where: eq(locations.address, invoice.location),
      });
      if (foundLocation) {
        locationId = foundLocation.id;
      }
    }

    let totalActualPrice = 0;
    let totalQuotedPrice = 0;
    let totalSalePrice = 0;

    const invoiceId = crypto.randomUUID();

    for (const item of invoice.lineItems) {
      let currentProduct = existingProducts.find((p) => p.name === item.name);

      if (currentProduct) {
        // Update product prices if more recent or different
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
        // Add new product
        const newProductId = crypto.randomUUID();
        currentProduct = {
          id: newProductId,
          name: item.name,
          actualPrice: item.actualPrice,
          quotedPrice: item.quotedPrice,
          salePrice: item.salePrice,
          createdAt: new Date(),
        };
        productsToInsert.push(currentProduct);
        existingProducts.push(currentProduct); // Add to existingProducts to avoid re-creating in the same batch
      }

      lineItemsToInsert.push({
        invoiceId: invoiceId,
        productId: currentProduct.id,
        quantity: item.quantity,
        actualPrice: item.actualPrice,
        quotedPrice: item.quotedPrice,
        salePrice: item.salePrice,
        receivedPrice: 0, // Assuming receivedPrice is 0 for imported items initially
      });

      totalActualPrice += item.actualPrice * item.quantity;
      totalQuotedPrice += item.quotedPrice * item.quantity;
      totalSalePrice += item.salePrice * item.quantity;
    }

    invoicesToInsert.push({
      id: invoiceId,
      companyId: firstCompany.id,
      clientId: firstClient.id,
      locationId: locationId,
      invoiceNumber: invoice.invoiceNumber,
      dateOfDelivery: invoice.dateOfDelivery,
      dateOfInvoice: invoice.dateOfInvoice,
      status: 'delivery_acknowledged', // Default status for imported invoices
      actualPrice: totalActualPrice,
      quotedPrice: totalQuotedPrice,
      salePrice: totalSalePrice,
      receivedAmount: invoice.receivedAmount,
    });
  }

  await db.transaction(async (tx) => {
    if (productsToInsert.length > 0) {
      await tx.insert(products).values(productsToInsert);
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

    if (invoicesToInsert.length > 0) {
      await tx.insert(invoicesTable).values(invoicesToInsert);
    }
    if (lineItemsToInsert.length > 0) {
      await tx.insert(lineItems).values(lineItemsToInsert);
    }
  });

  return json({ success: true });
}
