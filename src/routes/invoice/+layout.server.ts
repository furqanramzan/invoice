import { db } from '$lib/server/db';
import { Locations } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function load() {
  const [companies, clients, locations] = await Promise.all([
    db.query.Companies.findMany(),
    db.query.Clients.findMany(),
    db.query.Locations.findMany({
      orderBy: asc(Locations.address),
    }),
  ]);

  return {
    companies,
    clients,
    locations,
  };
}
