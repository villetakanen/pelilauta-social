import type { APIContext } from 'astro';
import { logDebug } from 'src/utils/logHelpers';
import { serverAuth } from '../../../firebase/server';

export async function verifySession(astro: APIContext) {
  const cookie = astro.cookies.get('session')?.value;
  if (!cookie) {
    return null;
  }
  try {
    const decodedToken = await serverAuth.verifySessionCookie(cookie, true);
    logDebug('auth', 'verifySession', 'Session cookie verified successfully');
    return decodedToken;
  } catch (_error) {
    // Session cookie is invalid.
    return null;
  }
}
