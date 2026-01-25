import { hash } from '@node-rs/argon2';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, type RequestEvent } from '@sveltejs/kit';
import type { SuperValidated } from 'sveltekit-superforms';

const argon2 = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string) {
  return hash(password, argon2);
}

interface SaveUserArgs {
  id?: string;
  name: string;
  email: string;
  password?: string;
  form: SuperValidated<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function saveUser({
  id,
  name,
  email,
  password,
  form,
}: SaveUserArgs): Promise<
  string | undefined | Awaited<ReturnType<typeof fail>>
> {
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  try {
    if (id) {
      // Update existing user
      const updateData: Partial<typeof table.user.$inferInsert> = {
        name,
        email,
      };
      if (passwordHash) {
        updateData.passwordHash = passwordHash;
      }
      await db.update(table.user).set(updateData).where(eq(table.user.id, id));
      return id;
    } else {
      // Create new user
      if (!passwordHash) {
        form.message = 'Password is required for new users.';
        return fail(400, { form });
      }
      const [newUser] = await db
        .insert(table.user)
        .values({
          name,
          email,
          passwordHash,
        })
        .returning({ id: table.user.id });
      return newUser.id;
    }
  } catch (e: unknown) {
    if (
      (e as { message: string }).message.includes(
        'UNIQUE constraint failed: users.email',
      )
    ) {
      form.message = 'Email already exists.';
      return fail(400, { form });
    }
    console.error(e);
    form.message = 'Could not save user.';
    return fail(500, { form });
  }
}

export async function createSessionToken(event: RequestEvent, userId: string) {
  const sessionToken = auth.generateSessionToken();
  const session = await auth.createSession(sessionToken, userId);
  auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
}
