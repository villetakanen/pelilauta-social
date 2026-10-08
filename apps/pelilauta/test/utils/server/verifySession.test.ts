import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { APIContext } from 'astro';
import { GET } from 'src/pages/api/auth/session';
import { verifySession } from 'src/utils/server/auth/verifySession';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A plain function keeps vitest from tracking the thrown verifier errors.
const verifier = vi.hoisted(() => ({
  impl: async (_cookie: string, _checkRevoked: boolean): Promise<unknown> => {
    throw new Error('verifier not configured');
  },
}));

vi.mock('src/firebase/server', () => ({
  serverAuth: {
    verifySessionCookie: (cookie: string, checkRevoked: boolean) =>
      verifier.impl(cookie, checkRevoked),
  },
}));
vi.mock('src/utils/logHelpers', () => ({ logDebug: vi.fn() }));

const context = (cookie?: string) =>
  ({
    cookies: { get: () => (cookie ? { value: cookie } : undefined) },
  }) as unknown as APIContext;

const fail = (code: string, message = 'detail') =>
  Object.assign(new Error(message), { code });

let calls: unknown[][] = [];

function setResult(value: unknown) {
  verifier.impl = async (...args) => {
    calls.push(args);
    return value;
  };
}

function setFailure(error: unknown) {
  verifier.impl = async (...args) => {
    calls.push(args);
    throw error;
  };
}

beforeEach(() => {
  calls = [];
});

async function status(cookie?: string) {
  const response = await (GET as (c: APIContext) => Promise<Response>)(
    context(cookie),
  );
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  return response;
}

describe('GET /api/auth/session', () => {
  it('returns only uid and expiresAt after a revocation-checked verification', async () => {
    setResult({
      uid: 'A',
      exp: 1900000000,
      email: 'a@example.com',
    });
    const response = await status('cookie');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ uid: 'A', expiresAt: 1900000000 });
    expect(calls).toEqual([['cookie', true]]);
  });

  it('returns 401 without a cookie', async () => {
    expect((await status()).status).toBe(401);
    expect(calls).toEqual([]);
  });

  it.each([
    'auth/session-cookie-expired',
    'auth/argument-error',
    'auth/session-cookie-revoked',
    'auth/user-disabled',
    'auth/user-not-found',
  ])('returns 401 for %s', async (code) => {
    setFailure(fail(code));
    const response = await status('cookie');
    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  it.each([
    ['app/network-timeout', 'x'],
    ['app/network-error', 'x'],
    ['ETIMEDOUT', 'x'],
    ['auth/argument-error', 'Error fetching public keys for Google certs: 503'],
  ])('returns 503 for %s', async (code, message) => {
    setFailure(fail(code, message));
    const response = await status('cookie');
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('');
  });

  it.each([fail('auth/internal-error'), new Error('boom'), 'not an error'])(
    'returns 500 for an unclassified error',
    async (error) => {
      setFailure(error);
      expect((await status('cookie')).status).toBe(500);
    },
  );
});

describe('verifySession', () => {
  it('returns the decoded token on success', async () => {
    setResult({ uid: 'A' });
    expect(await verifySession(context('cookie'))).toEqual({ uid: 'A' });
  });

  it.each([
    fail('auth/session-cookie-revoked'),
    fail('app/network-timeout'),
    fail('auth/internal-error'),
    new Error('boom'),
  ])('returns null for every verifier error', async (error) => {
    setFailure(error);
    expect(await verifySession(context('cookie'))).toBeNull();
  });
});

// The key-fetch outage is told apart from a forged cookie by firebase-admin's
// message text alone; an upgrade that rewords it fails here.
describe('firebase-admin key-fetch messages', () => {
  const lib = dirname(createRequire(import.meta.url).resolve('firebase-admin'));
  const source = (file: string) => readFileSync(join(lib, file), 'utf8');

  it.each([
    ['utils/jwt.js', 'Error fetching public keys'],
    ['utils/api-request.js', 'Error while making request'],
  ])('%s still raises "%s"', (file, prefix) => {
    expect(source(file)).toContain(prefix);
  });
});
