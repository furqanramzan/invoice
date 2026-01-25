import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { userSchema } from './validations';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { resolve } from '$app/paths';
import { saveUser } from '$lib/server/user';

export const load = async ({ url }) => {
  const id = url.searchParams.get('id');
  let currentUser = null;

  if (id) {
    currentUser = await db.query.user.findFirst({
      where: eq(table.user.id, id),
    });

    if (!currentUser) {
      return redirect(302, resolve('/user'));
    }
  }

  const form = await superValidate(
    currentUser
      ? {
          ...currentUser,
          password: undefined, // Never pre-fill password
        }
      : undefined,
    zod4(userSchema),
  );

  return { form, currentUser };
};

export const actions = {
  default: async (event) => {
    const form = await superValidate(event.request, zod4(userSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { id, name, email, password } = form.data;

    const result = await saveUser({
      id,
      name,
      email,
      password,
      form,
    });

    if (typeof result !== 'string' && result !== undefined) {
      return result; // Return the fail response from saveUser
    }

    if (!id) {
      return redirect(302, resolve('/user')); // Redirect to user list after creation
    }
    return { form };
  },
};
