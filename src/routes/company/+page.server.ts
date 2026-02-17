import { db } from '$lib/server/db';
import { Companies } from '$lib/server/db/schema';
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
    db.query.Companies.findMany({
      limit,
      offset,
      orderBy: desc(Companies.createdAt),
    }),
    db.select({ count: count() }).from(Companies),
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

    const companyToDelete = await db.query.Companies.findFirst({
      where: eq(Companies.id, form.data.id),
    });

    if (companyToDelete?.logoUrl) {
      await delFile(companyToDelete.logoUrl);
    }

    await db.delete(Companies).where(eq(Companies.id, form.data.id));

    return sendMessage(form, `${title.singular} deleted!`);
  },
};
