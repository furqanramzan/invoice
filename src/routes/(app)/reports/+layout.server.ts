import { db } from '$lib/server/db';

export async function load() {
  const companies = await db.query.Companies.findMany();
  return { companies };
}
