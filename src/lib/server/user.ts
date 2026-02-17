import { hash } from '@node-rs/argon2';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { type RequestEvent } from '@sveltejs/kit';
import type { RegisterSchema } from '$lib/validations';
import type { Users } from '$lib/server/db/schema';

const argon2 = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string) {
  return hash(password, argon2);
}

export async function saveUser(data: RegisterSchema) {
  const { id, password, ...userData } = data;
  let passwordHash: string | undefined;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  if (id) {
    const updateData: Partial<Users> = {
      ...userData,
    };
    if (passwordHash) {
      updateData.passwordHash = passwordHash;
    }
    await db.update(table.Users).set(updateData).where(eq(table.Users.id, id));

    return { id };
  }

  if (!passwordHash) {
    return 'Password is required for new users.';
  }
  const [newUser] = await db
    .insert(table.Users)
    .values({
      ...userData,
      passwordHash,
    })
    .returning({ id: table.Users.id });
  return newUser;
}

export async function createSessionToken(event: RequestEvent, userId: number) {
  const sessionToken = auth.generateSessionToken();
  const session = await auth.createSession(sessionToken, userId);
  auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
}
