import { db } from '$lib/server/db';
import { Expenses } from '$lib/server/db/schema';
import { expenseSchema, route, title } from './utils';
import { eq } from 'drizzle-orm';
import { initForm, redirectTo, validateAction } from '$lib/superforms.js';
import { convertCents, convertToCents } from '$lib/utils.js';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentExpense = null;

  if (id) {
    currentExpense = await db.query.Expenses.findFirst({
      where: eq(Expenses.id, id),
    });

    if (!currentExpense) {
      return redirectTo(route.list, event, `${title.singular} not found!`);
    }
  }

  const form = await initForm(
    expenseSchema,
    currentExpense
      ? {
          ...currentExpense,
          amount: convertCents(currentExpense.amount),
        }
      : { date: new Date() },
  );

  return { form, currentExpense };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, expenseSchema);
    if (!form.valid) return form.error;

    const { id, ...data } = form.data;

    const expenseData = {
      ...data,
      amount: convertToCents(data.amount),
      date: new Date(data.date),
    };

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
