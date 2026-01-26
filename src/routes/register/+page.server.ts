import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { registerSchema } from '$lib/validations';
import { saveUser, createSessionToken } from '$lib/server/user';
import {
  initForm,
  redirectTo,
  sendMessage,
  validateAction,
} from '$lib/superforms';

export const load: PageServerLoad = async () => {
  const users = await db.select().from(table.user);
  if (users.length > 0) {
    return redirectTo('/');
  }

  const form = await initForm(registerSchema);
  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const users = await db.select().from(table.user);
    if (users.length > 0) {
      return redirectTo('/');
    }

    const form = await validateAction(event, registerSchema);
    if (!form.valid) return form.error;

    const user = await saveUser(form.data);
    if (typeof user === 'string') {
      return sendMessage(form, user, 'error');
    }

    await createSessionToken(event, user.id);

    return redirectTo('/invoice');
  },
};
