import type { RequestHandler } from './$types';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '$lib/server/trpc/router';

export const GET: RequestHandler = (event) => {
  return fetchRequestHandler({
    endpoint: '/api',
    req: event.request,
    router: appRouter,
    createContext() {
      return {
        event,
      };
    },
  });
};

export const POST = GET;
