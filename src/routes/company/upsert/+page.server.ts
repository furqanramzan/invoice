import { db } from '$lib/server/db';
import { companies, type Company } from '$lib/server/db/schema';
import { companySchema, route, title, type PrintLayout } from './utils';
import { eq } from 'drizzle-orm';
import { getUser } from '$lib/server/auth';
import { initForm, redirectTo, validateAction } from '$lib/superforms';
import { delFile, putFile } from '$lib/server/filesystem.js';

export const load = async (event) => {
  const id = event.url.searchParams.get('id');
  let currentCompany = null;

  if (id) {
    currentCompany = await db.query.companies.findFirst({
      where: eq(companies.id, id),
    });

    if (!currentCompany) {
      return redirectTo(route.list, event, `${title.singular} not found!`);
    }
  }

  const form = await initForm(
    companySchema,
    currentCompany
      ? {
          ...currentCompany,
          printLayout: currentCompany.printLayout as unknown as PrintLayout,
        }
      : undefined,
  );

  return { form, currentCompany };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, companySchema);
    if (!form.valid) return form.error;

    let currentCompany: Company | undefined;
    if (form.data.id) {
      currentCompany = await db.query.companies.findFirst({
        where: eq(companies.id, form.data.id),
      });
    }
    const { id, logo, ...companyData } = form.data;
    const user = getUser();

    if (currentCompany?.logoUrl && (logo || !companyData.logoUrl)) {
      await delFile(currentCompany.logoUrl);
    }
    if (logo) {
      companyData.logoUrl = await putFile(
        `company_logos/${crypto.randomUUID()}-${logo.name}`,
        logo,
      );
    }

    const dataToSave = {
      ...companyData,
      userId: user.id,
    };

    if (id) {
      await db.update(companies).set(dataToSave).where(eq(companies.id, id));
    } else {
      await db.insert(companies).values(dataToSave);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
