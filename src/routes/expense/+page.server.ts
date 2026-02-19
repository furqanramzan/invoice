import { db } from '$lib/server/db';
import { Expenses } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { itemSchema } from '$lib/validations.js'; // Assuming itemSchema is a generic schema for ID deletion
import { getPaginationData } from '$lib/utils.js';
import { initForm, sendMessage, validateAction } from '$lib/superforms';
import { title } from './upsert/utils.js';
import { delFile } from '$lib/server/filesystem.js';

export async function load(event) {
  const form = await initForm(itemSchema); // Generic form for deletion

  const { page, offset, limit } = getPaginationData(event);

  const [allExpenses, [{ count: totalExpenses }]] = await Promise.all([
    db.query.Expenses.findMany({
      limit,
      offset,
      orderBy: desc(Expenses.createdAt),
    }),
    db.select({ count: count() }).from(Expenses),
  ]);

  return {
    form,
    expenses: allExpenses,
    currentPage: page,
    totalPages: Math.ceil(totalExpenses / limit),
  };
}

export const actions = {
  async default(event) {
    const form = await validateAction(event, itemSchema);
    if (!form.valid) return form.error;

    const expense = await db.query.Expenses.findFirst({
      where: eq(Expenses.id, form.data.id),
      columns: { attachmentUrls: true },
    });
    if (!expense) {
      return sendMessage(form, `${title.singular} not found!`, 'error');
    }

    if (expense.attachmentUrls?.length) {
      await Promise.all(
        expense.attachmentUrls.map((file) => delFile(file.url)),
      );
    }

    await db.delete(Expenses).where(eq(Expenses.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
