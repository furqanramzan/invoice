import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { resolve } from '$app/paths';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { registerSchema } from '$lib/validations';
import { saveUser, createSessionToken } from '$lib/server/user';

export const load: PageServerLoad = async ({ locals }) => {
  const users = await db.select().from(table.user);
  if (users.length > 0) {
    redirect(302, resolve('/'));
  }

  // To prevent already logged in user from accessing register page
  if (locals.user) {
    redirect(302, resolve('/invoice'));
  }

  const form = await superValidate(zod4(registerSchema));
  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event.request, zod4(registerSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const userId = await saveUser({
      name: form.data.name,
      email: form.data.email,
      password: form.data.password,
      form: form,
    });

    if (typeof userId !== 'string') {
      return userId; // Return the fail response from saveUser
    }

    await createSessionToken(event, userId);

    return redirect(302, resolve('/invoice'));
  },
};
