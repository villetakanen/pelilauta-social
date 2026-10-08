import type { APIContext } from 'astro';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { logDebug } from 'src/utils/logHelpers';
import { serverAuth } from '../../../firebase/server';

export type SessionVerification =
  | { status: 'verified'; token: DecodedIdToken }
  | { status: 'rejected' | 'unavailable' | 'failed' };

// Credential failures raised by verifySessionCookie(cookie, true) in
// firebase-admin (utils/error.js, auth/token-verifier.js, auth/base-auth.js).
// argument-error covers malformed tokens, bad signatures, and unknown key ids.
const REJECTED_CODES = new Set([
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/argument-error',
  'auth/user-disabled',
  'auth/user-not-found',
]);

// Transport failures of the revocation lookup (utils/api-request.js) and of
// the public key fetch (Node socket error codes).
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

// A failed public key fetch surfaces as auth/argument-error whose message
// keeps the fetcher's text (utils/jwt.js, auth/token-verifier.js).
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

/**
 * Verifies the session cookie with revocation checking and classifies a
 * failure as rejected credentials, unavailable verification, or unclassified.
 */
export async function checkSession(
  astro: APIContext,
): Promise<SessionVerification> {
  const cookie = astro.cookies.get('session')?.value;
  if (!cookie) {
    return { status: 'rejected' };
  }
  try {
    const token = await serverAuth.verifySessionCookie(cookie, true);
    logDebug('auth', 'verifySession', 'Session cookie verified successfully');
    return { status: 'verified', token };
  } catch (error) {
    return { status: classify(error) };
  }
}

export async function verifySession(astro: APIContext) {
  const result = await checkSession(astro);
  return result.status === 'verified' ? result.token : null;
}
