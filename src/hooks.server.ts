import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { resolve as resolvePath } from '$app/paths';

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;

    if (!guestRoutes(event)) {
      return redirect(302, resolvePath('/'));
    }

    return resolve(event);
  }

  if (guestRoutes(event)) {
    return redirect(302, resolvePath('/invoice'));
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    auth.deleteSessionTokenCookie(event);
  }

  event.locals.user = user;
  event.locals.session = session;

  if (!guestRoutes(event) && !event.locals.user) {
    return redirect(302, resolvePath('/'));
  }

  return resolve(event);
};

function guestRoutes(event: RequestEvent) {
  return (
    event.url.pathname === '/' ||
    ['/register', '/import/save'].some((url) =>
      event.url.pathname.startsWith(url),
    )
  );
}

export const handle: Handle = handleAuth;
