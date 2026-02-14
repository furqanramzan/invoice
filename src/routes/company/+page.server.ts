import { db } from '$lib/server/db';
import { companies } from '$lib/server/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { initForm, sendMessage, validateAction } from '$lib/superforms.js';
import { title } from './upsert/utils.js';
import { getPaginationData } from '$lib/utils.js';
import { delFile } from '$lib/server/filesystem.js';
import { deleteSchema } from '$lib/validations.js';

export async function load(event) {
  const form = await initForm(deleteSchema);

  const { page, offset, limit } = getPaginationData(event);

  const [allCompanies, [{ count: totalCompanies }]] = await Promise.all([
    db.query.companies.findMany({
      limit,
      offset,
      orderBy: desc(companies.createdAt),
    }),
    db.select({ count: count() }).from(companies),
  ]);

  return {
    form,
    companies: allCompanies,
    currentPage: page,
    totalPages: Math.ceil(totalCompanies / limit),
  };
}

export const actions = {
  async default(event) {
    const form = await validateAction(event, deleteSchema);

    if (!form.valid) return form.error;

    const companyToDelete = await db.query.companies.findFirst({
      where: eq(companies.id, form.data.id),
    });

    if (companyToDelete?.logoUrl) {
      await delFile(companyToDelete.logoUrl);
    }

    await db.delete(companies).where(eq(companies.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
