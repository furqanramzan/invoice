import { db } from '$lib/server/db';
import { Companies, type Company } from '$lib/server/db/schema';
import {
  companySchema,
  route,
  title,
  type PrintLayout,
} from './utils';
import { eq } from 'drizzle-orm';
import {
  initForm,
  redirectTo,
  validateAction,
} from '$lib/superforms';
import { delFile, putFile } from '$lib/server/filesystem.js';

export const load = async (event) => {
  const id = Number(event.url.searchParams.get('id'));
  let currentCompany: Company | undefined;

  if (id) {
    currentCompany = await db.query.Companies.findFirst({
      where: eq(Companies.id, id),
    });

    if (!currentCompany) {
      return redirectTo(
        route.list,
        event,
        `${title.singular} not found!`,
      );
    }
  }

  const form = await initForm(
    companySchema,
    currentCompany
      ? {
          ...currentCompany,
          printLayout:
            currentCompany.printLayout as unknown as PrintLayout,
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
      currentCompany = await db.query.Companies.findFirst({
        where: eq(Companies.id, form.data.id),
      });
    }
    const { id, logo, ...companyData } = form.data;

    if (
      currentCompany?.logoUrl &&
      (logo || !companyData.logoUrl)
    ) {
      await delFile(currentCompany.logoUrl);
    }
    if (logo) {
      companyData.logoUrl = await putFile(
        `company_logos/${crypto.randomUUID()}-${logo.name}`,
        logo,
      );
    }

    if (id) {
      await db
        .update(Companies)
        .set(companyData)
        .where(eq(Companies.id, id));
    } else {
      await db.insert(Companies).values(companyData);
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${id ? 'updated' : 'created'}!`,
    );
  },
};
