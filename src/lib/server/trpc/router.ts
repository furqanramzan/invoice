import { router } from './init';
import { invoice } from './invoice';

export const appRouter = router({
  invoice,
});

export type AppRouter = typeof appRouter;
