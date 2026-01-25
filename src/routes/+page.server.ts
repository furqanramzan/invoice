import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { resolve } from '$app/paths';
import { superValidate, message } from 'sveltekit-superforms/server';
import { loginSchema } from '$lib/validations';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createSessionToken } from '$lib/server/user';

export const load: PageServerLoad = async ({ locals }) => {
  const users = await db.select().from(table.user);
  if (users.length === 0) {
    redirect(302, resolve('/register'));
  }

  // To prevent already logged in user from accessing login page
  if (locals.user) {
    redirect(302, resolve('/invoice'));
  }
  const form = await superValidate(zod4(loginSchema));
  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event.request, zod4(loginSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const results = await db
      .select()
      .from(table.user)
      .where(eq(table.user.email, form.data.email));

    const existingUser = results.at(0);
    if (!existingUser) {
      return message(form, 'Incorrect email or password', { status: 400 });
    }

    const validPassword = await verify(
      existingUser.passwordHash,
      form.data.password,
      {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      },
    );
    if (!validPassword) {
      return message(form, 'Incorrect email or password', { status: 400 });
    }

    await createSessionToken(event, existingUser.id);

    return redirect(302, resolve('/invoice'));
  },
};
