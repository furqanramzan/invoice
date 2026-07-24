import { db } from '$lib/server/db';
import { Expenses } from '$lib/server/db/schema';
import { expenseSchema, route, title } from './utils';
import { eq } from 'drizzle-orm';
import {
  initForm,
  redirectTo,
  validateAction,
} from '$lib/superforms.js';
import { convertCents, convertToCents } from '$lib/utils.js';
import { delFile, putFile } from '$lib/server/filesystem';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentExpense = null;

  if (id) {
    currentExpense = await db.query.Expenses.findFirst({
      where: eq(Expenses.id, id),
    });

    if (!currentExpense) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not found!`,
      );
    }
  }

  const { companies } = await event.parent();

  const form = await initForm(
    expenseSchema,
    currentExpense
      ? {
          ...currentExpense,
          amount: convertCents(currentExpense.amount),
        }
      : { date: new Date(), attachmentUrls: [], companyId: companies.at(0)?.id },
  );

  return { form, currentExpense, companies };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, expenseSchema);
    if (!form.valid) return form.error;

    const { id, attachments, ...data } = form.data;

    const expenseData = {
      ...data,
      amount: convertToCents(data.amount),
      date: new Date(data.date),
    };

    if (attachments?.length) {
      expenseData.attachmentUrls = [
        ...(expenseData?.attachmentUrls || []),
        ...(
          await Promise.all(
            attachments.map((image) =>
              putFile(
                `expenses/${crypto.randomUUID()}-${image.name}`,
                image,
              ),
            ),
          )
        ).map((x, index) => ({
          url: x,
          name: attachments[index].name,
        })),
      ];
    }

    if (expenseData.attachmentUrls?.some((x) => x.deleted)) {
      await Promise.all(
        expenseData.attachmentUrls
          .filter((x) => x.deleted)
          .map((file) => delFile(file.url)),
      );
      expenseData.attachmentUrls =
        expenseData.attachmentUrls.filter(
          (file) => !file.deleted,
        );
    }

    if (id) {
      await db
        .update(Expenses)
        .set(expenseData)
        .where(eq(Expenses.id, Number(id)));
    } else {
      await db.insert(Expenses).values(expenseData);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
