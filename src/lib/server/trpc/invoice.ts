import { procedure, router } from './init';
import { itemSchema } from '$lib/validations';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { Invoices } from '../db/schema';
import { convertCents } from '$lib/utils';

export const invoice = router({
  item: procedure.input(itemSchema).query(async (params) => {
    const invoice = await db.query.Invoices.findFirst({
      where: eq(Invoices.id, params.input.id),
      with: {
        company: true,
        client: true,
        location: true,
        lineItems: {
          with: { product: true },
        },
      },
    });

    return {
      ...invoice,
      receivedAmount: invoice?.receivedAmount
        ? convertCents(invoice.receivedAmount)
        : undefined,
      lineItems: invoice?.lineItems.map((lineItem) => ({
        ...lineItem,
        name: lineItem.product.name,
        actualPrice: convertCents(lineItem.actualPrice),
        quotedPrice: convertCents(lineItem.quotedPrice),
        salePrice: convertCents(lineItem.salePrice),
        receivedPrice: convertCents(lineItem.receivedPrice),
      })),
    };
  }),
});
