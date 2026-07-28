import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals, route }) => {
  const publicRoutes = ['/(app)/import/save'];

  if (!publicRoutes.includes(route.id ?? '')) {
    if (!locals.user) {
      redirect(302, '/');
    }
  }

  return {
    user: locals.user ? { id: locals.user.id, email: locals.user.email } : null,
  };
};
