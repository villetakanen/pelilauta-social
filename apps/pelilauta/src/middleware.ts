import { defineMiddleware } from 'astro:middleware';
import {
  type SessionVerification,
  verifySessionCookie,
} from './utils/server/auth/verifySession';

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.cookies.get('session')?.value;
  let verification: Promise<SessionVerification> | undefined;
  context.locals.resolveSession = () => {
    context.locals.authenticationDependent = true;
    verification ??= verifySessionCookie(cookie);
    return verification;
  };

  let response: Response;
  try {
    response = await next();
  } catch (error) {
    if (!context.locals.authenticationDependent) throw error;

    console.error('Authentication-dependent request failed:', error);
    // A null body allows Astro to reroute the 500 response outside this cache boundary.
    response = new Response('Internal Server Error', { status: 500 });
  }
  if (!context.locals.authenticationDependent) return response;

  const headers = new Headers(response.headers);
  for (const name of [
    'Cache-Control',
    'CDN-Cache-Control',
    'Netlify-CDN-Cache-Control',
    'Vercel-CDN-Cache-Control',
  ]) {
    headers.set(name, 'no-store');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
