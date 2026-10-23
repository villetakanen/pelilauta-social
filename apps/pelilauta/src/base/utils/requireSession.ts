import { checkSession } from '@utils/server/auth/verifySession';
import { sanitizeRedirect } from '@utils/shared/sanitizeRedirect';
import type { APIContext } from 'astro';

type Guarded = { uid: string; denied: null } | { uid: null; denied: Response };

export async function requireSession(astro: APIContext): Promise<Guarded> {
  const session = await checkSession(astro);
  if (session.status === 'verified') {
    astro.locals.protectedDocument = true;
    return { uid: session.token.uid, denied: null };
  }

  const status =
    session.status === 'rejected'
      ? 401
      : session.status === 'unavailable'
        ? 503
        : 500;
  const method = astro.request.method;
  if (
    (method !== 'GET' && method !== 'HEAD') ||
    astro.routePattern.startsWith('/api/')
  ) {
    return {
      uid: null,
      denied: astro.redirect(
        `/login?redirect=${encodeURIComponent(astro.url.pathname)}`,
      ),
    };
  }
  if (method === 'HEAD') {
    return { uid: null, denied: new Response(null, { status }) };
  }
  if (astro.locals.protectedRecovery || astro.url.pathname === '/login') {
    return {
      uid: null,
      denied: new Response('Authentication failed', { status }),
    };
  }
  astro.locals.protectedRecovery = {
    status,
    destination: sanitizeRedirect(astro.url.pathname + astro.url.search),
  };
  return { uid: null, denied: await astro.rewrite('/login') };
}
