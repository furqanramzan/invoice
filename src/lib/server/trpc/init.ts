import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { RequestEvent } from '@sveltejs/kit';

const t = initTRPC.context<{ event: RequestEvent }>().create({
  transformer: superjson,
});

export const router = t.router;
export const procedure = t.procedure;
