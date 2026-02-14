import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { resolve } from '$app/paths';
import { saveUser } from '$lib/server/user';
import { registerSchema } from '$lib/validations.js';
import {
  initForm,
  redirectTo,
  sendMessage,
  validateAction,
} from '$lib/superforms';
import { route, title } from './utils.js';

export const load = async ({ url }) => {
  const id = Number(url.searchParams.get('id'));
  let currentUser = null;

  if (id) {
    currentUser = await db.query.user.findFirst({
      where: eq(table.user.id, id),
    });

    if (!currentUser) {
      return redirect(302, resolve('/user'));
    }
  }

  const form = await initForm(
    registerSchema,
    currentUser
      ? {
          ...currentUser,
          password: undefined, // Never pre-fill password
        }
      : undefined,
  );

  return { form, currentUser };
};

export const actions = {
  default: async (event) => {
    const form = await validateAction(event, registerSchema);
    if (!form.valid) return form.error;

    const userId = await saveUser(form.data);
    if (typeof userId === 'string') {
      return sendMessage(form, userId, 'error');
    }

    return redirectTo(
      route.list,
      event,
      `${title.singular} ${form.data.id ? 'updated' : 'created'}!`,
    );
  },
};
