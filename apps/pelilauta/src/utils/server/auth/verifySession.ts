import type { APIContext } from 'astro';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { logDebug } from 'src/utils/logHelpers';

export type SessionVerification =
  | { status: 'verified'; token: DecodedIdToken }
  | { status: 'rejected' | 'unavailable' | 'failed' };

// `verifySessionCookie(cookie, true)` in `firebase-admin` (`utils/error.js`,
// `auth/token-verifier.js`, `auth/base-auth.js`) raises these credential failures.
// The `argument-error` code covers malformed tokens, bad signatures, and unknown key IDs.
const REJECTED_CODES = new Set([
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/argument-error',
  'auth/user-disabled',
  'auth/user-not-found',
]);

// The revocation lookup (`utils/api-request.js`) and the public key fetch
// (Node socket error codes) raise these transport failures.
const UNAVAILABLE_CODES = new Set([
  'app/network-error',
  'app/network-timeout',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);

// A failed public key fetch produces an `auth/argument-error` error whose message
// retains the text from the fetcher (`utils/jwt.js`, `auth/token-verifier.js`).
const KEY_FETCH_MESSAGE =
  /^(Error fetching public keys|Error while making request)/;

function classify(error: unknown): 'rejected' | 'unavailable' | 'failed' {
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  if (typeof code !== 'string') return 'failed';
  if (UNAVAILABLE_CODES.has(code)) return 'unavailable';
  if (
    code === 'auth/argument-error' &&
    typeof message === 'string' &&
    KEY_FETCH_MESSAGE.test(message)
  ) {
    return 'unavailable';
  }
  return REJECTED_CODES.has(code) ? 'rejected' : 'failed';
}

export async function verifySessionCookie(
  cookie: string | undefined,
): Promise<SessionVerification> {
  if (!cookie) {
    return { status: 'rejected' };
  }
  try {
    const { serverAuth } = await import('../../../firebase/server');
    const token = await serverAuth.verifySessionCookie(cookie, true);
    logDebug('auth', 'verifySession', 'Session cookie verified successfully');
    return { status: 'verified', token };
  } catch (error) {
    return { status: classify(error) };
  }
}

export function checkSession(astro: APIContext): Promise<SessionVerification> {
  return astro.locals.resolveSession();
}

export async function verifySession(astro: APIContext) {
  const result = await checkSession(astro);
  return result.status === 'verified' ? result.token : null;
}
