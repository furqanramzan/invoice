import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/trpc/router.js';
import superjson from 'superjson';

export function trpc() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api',
        transformer: superjson,
      }),
    ],
  });
}
