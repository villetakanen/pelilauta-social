import type { APIRoute } from 'astro';
import { checkSession } from 'src/utils/server/auth/verifySession';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  locals.authenticationDependent = true;
  const { token } = await request.json();

  try {
    const { serverAuth } = await import('../../../firebase/server');
    await serverAuth.verifyIdToken(token, true);

    const sessionCookie = await serverAuth.createSessionCookie(token, {
      expiresIn: 60 * 60 * 24 * 5 * 1000,
    });
    cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 5,
      sameSite: 'lax',
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error verifying token or creating session cookie:', error);
    return new Response('Unauthorized', { status: 401 });
  }
};

const noStore = { 'Cache-Control': 'no-store' };

export const GET: APIRoute = async (context) => {
  const result = await checkSession(context);
  if (result.status === 'verified') {
    return Response.json(
      { uid: result.token.uid, expiresAt: result.token.exp },
      { status: 200, headers: noStore },
    );
  }
  const status = { rejected: 401, unavailable: 503, failed: 500 }[
    result.status
  ];
  return new Response(null, { status, headers: noStore });
};

export const DELETE: APIRoute = async ({ cookies, locals }) => {
  locals.authenticationDependent = true;
  cookies.delete('session', { path: '/' });
  return new Response('OK', { status: 200 });
};
