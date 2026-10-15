import { createComponent, render } from 'astro/runtime/server/index.js';
import { requireAdmin } from 'src/admin/utils/requireAdmin';
import { requireSession } from 'src/base/utils/requireSession';
import { DELETE, GET, POST } from 'src/pages/api/auth/session';
import { GET as statusGET } from 'src/pages/api/auth/status';
import type { Site } from 'src/schemas/SiteSchema';
import { requireSiteOwner } from 'src/site/utils/requireSiteOwner';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { checkSession } from 'src/utils/server/auth/verifySession';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createContainer,
  renderEndpoint,
  sessionRequest,
} from './helpers/renderWithMiddleware';

const mocks = vi.hoisted(() => ({
  cookie: vi.fn(),
  idToken: vi.fn(),
  createCookie: vi.fn(),
  admin: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock('src/firebase/server', () => ({
  serverAuth: {
    verifySessionCookie: mocks.cookie,
    verifyIdToken: mocks.idToken,
    createSessionCookie: mocks.createCookie,
    getUser: mocks.getUser,
  },
  serverDB: {},
}));
vi.mock('src/firebase/server/admin', () => ({ isAdmin: mocks.admin }));
vi.mock('src/utils/logHelpers', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockResolvedValue({ uid: 'A', exp: 1900000000 });
  mocks.idToken.mockResolvedValue({ uid: 'bearer-user' });
  mocks.createCookie.mockResolvedValue('created-cookie');
  mocks.admin.mockResolvedValue(false);
  mocks.getUser.mockResolvedValue({
    customClaims: { eula_accepted: true, account_created: true },
  });
});

function expectPrivate(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('Netlify-CDN-Cache-Control')).toBe('no-store');
}

const site = { owners: ['A'] } as Site;

describe('route and resource guards through Astro middleware', () => {
  it.each([undefined, 'A'])(
    'enforces final protected HTML headers for cookie %s',
    async (cookie) => {
      const page = createComponent(async (result, props, slots) => {
        const astro = result.createAstro(props, slots);
        const { denied } = await requireSession(astro);
        if (denied) return denied;
        astro.response.headers.set('Cache-Control', 'public, s-maxage=60');
        return render`<html>Protected content</html>`;
      });
      const container = await createContainer();
      const response = await container.renderToResponse(page, {
        request: sessionRequest(cookie, '/protected'),
      });
      expectPrivate(response, cookie ? 200 : 302);
      if (cookie) expect(await response.text()).toContain('Protected content');
      else {
        expect(await response.text()).not.toContain('Protected content');
        expect(response.headers.get('Location')).toBe(
          '/login?redirect=%2Fprotected',
        );
      }
    },
  );

  it('shares verification between the session, administrator, owner, and status consumers', async () => {
    mocks.admin.mockResolvedValue(true);
    const response = await renderEndpoint(
      async (ctx) => {
        const [session, adminDenial, ownerDenial, status] = await Promise.all([
          requireSession(ctx),
          requireAdmin(ctx),
          requireSiteOwner(ctx, site),
          GET(ctx),
        ]);
        expect(session).toEqual({ uid: 'A', denied: null });
        expect(adminDenial).toBeUndefined();
        expect(ownerDenial).toBeUndefined();
        return status;
      },
      sessionRequest('A', '/not-a-protected-prefix'),
    );
    expectPrivate(response, 200);
    expect(await response.json()).toEqual({ uid: 'A', expiresAt: 1900000000 });
    expect(mocks.cookie).toHaveBeenCalledExactlyOnceWith('A', true);
    expect(mocks.admin).toHaveBeenCalledWith('A');
  });

  it.each(['session', 'admin', 'owner'])(
    'redirects a missing session at the matched %s guard',
    async (guard) => {
      const response = await renderEndpoint(
        async (ctx) => {
          const denied =
            guard === 'session'
              ? (await requireSession(ctx)).denied
              : guard === 'admin'
                ? await requireAdmin(ctx)
                : await requireSiteOwner(ctx, site);
          return denied ?? new Response('protected');
        },
        sessionRequest(undefined, '/tools/nested'),
      );
      expectPrivate(response, 302);
      expect(response.headers.get('Location')).toBe(
        '/login?redirect=%2Ftools%2Fnested',
      );
      expect(mocks.cookie).not.toHaveBeenCalled();
      expect(mocks.admin).not.toHaveBeenCalled();
    },
  );

  it.each([
    'auth/session-cookie-revoked',
    'app/network-timeout',
    'auth/internal-error',
  ])('retains login redirects for %s', async (code) => {
    mocks.cookie.mockImplementation(async () => {
      throw { code };
    });
    const response = await renderEndpoint(
      async (ctx) => {
        return (await requireSession(ctx)).denied ?? new Response('protected');
      },
      sessionRequest('A', '/library'),
    );
    expectPrivate(response, 302);
    expect(response.headers.get('Location')).toBe('/login?redirect=%2Flibrary');
  });

  it('isolates overlapping status requests for different users', async () => {
    const releases = new Map<string, (token: unknown) => void>();
    mocks.cookie.mockImplementation(
      (cookie: string) =>
        new Promise((resolve) => {
          releases.set(cookie, resolve);
        }),
    );
    const first = renderEndpoint(GET, sessionRequest('A'));
    await vi.waitFor(() => expect(mocks.cookie).toHaveBeenCalledTimes(1));
    const second = renderEndpoint(GET, sessionRequest('B'));
    await vi.waitFor(() => expect(mocks.cookie).toHaveBeenCalledTimes(2));
    releases.get('B')?.({ uid: 'B', exp: 1900000001 });
    releases.get('A')?.({ uid: 'A', exp: 1900000000 });
    const responses = await Promise.all([first, second]);
    expectPrivate(responses[0], 200);
    expectPrivate(responses[1], 200);
    expect(await responses[0].json()).toEqual({
      uid: 'A',
      expiresAt: 1900000000,
    });
    expect(await responses[1].json()).toEqual({
      uid: 'B',
      expiresAt: 1900000001,
    });
  });

  it('denies an authenticated non-administrator', async () => {
    const response = await renderEndpoint(
      async (ctx) => (await requireAdmin(ctx)) ?? new Response('admin'),
      sessionRequest('A'),
    );
    expectPrivate(response, 302);
    expect(response.headers.get('Location')).toBe('/403');
    expect(mocks.admin).toHaveBeenCalledWith('A');
  });

  it('denies a non-owner even when authenticated as an administrator', async () => {
    mocks.admin.mockResolvedValue(true);
    const response = await renderEndpoint(
      async (ctx) =>
        (await requireSiteOwner(ctx, { owners: ['B'] } as Site)) ??
        new Response('owner'),
      sessionRequest('A'),
    );
    expectPrivate(response, 403);
    expect(await response.text()).toBe('Forbidden');
  });

  it('permits the owner only for the authorized resource in the same request', async () => {
    const response = await renderEndpoint(async (ctx) => {
      expect(await requireSiteOwner(ctx, site)).toBeUndefined();
      return (
        (await requireSiteOwner(ctx, { owners: ['B'] } as Site)) ??
        new Response('owner')
      );
    }, sessionRequest('A'));
    expectPrivate(response, 403);
    expect(mocks.cookie).toHaveBeenCalledTimes(1);
  });
});

describe('authentication endpoints through Astro middleware', () => {
  it('keeps the account-status response private', async () => {
    const response = await renderEndpoint(statusGET, sessionRequest('A'));
    expectPrivate(response, 200);
    expect(await response.json()).toEqual({
      loggedIn: true,
      eula_accepted: true,
      account_created: true,
      uid: 'A',
    });
    expect(mocks.getUser).toHaveBeenCalledWith('A');
  });

  it('keeps account-status denials private without fetching account data', async () => {
    const response = await renderEndpoint(statusGET, sessionRequest());
    expectPrivate(response, 401);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('keeps account-status server errors private', async () => {
    mocks.getUser.mockRejectedValueOnce(new Error('offline'));
    const response = await renderEndpoint(statusGET, sessionRequest('A'));
    expectPrivate(response, 500);
  });

  it('creates the cookie without verifying or replacing incoming identity', async () => {
    const request = new Request('https://example.com/api/auth/session', {
      method: 'POST',
      headers: { Cookie: 'session=A', 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'id-token' }),
    });
    const response = await renderEndpoint(async (ctx) => {
      const created = await POST(ctx);
      expect(created.status).toBe(200);
      expect(mocks.cookie).not.toHaveBeenCalled();
      expect(ctx.cookies.get('session')?.value).toBe('created-cookie');
      expect([...ctx.cookies.headers()][0]).toMatch(/HttpOnly/i);
      expect(await checkSession(ctx)).toEqual({
        status: 'verified',
        token: { uid: 'A', exp: 1900000000 },
      });
      return created;
    }, request);
    expectPrivate(response, 200);
    expect(mocks.idToken).toHaveBeenCalledExactlyOnceWith('id-token', true);
    expect(mocks.createCookie).toHaveBeenCalledExactlyOnceWith('id-token', {
      expiresIn: 60 * 60 * 24 * 5 * 1000,
    });
    expect(mocks.cookie).toHaveBeenCalledExactlyOnceWith('A', true);
  });

  it('keeps a successful cookie POST private without resolving the session', async () => {
    const response = await renderEndpoint(
      POST,
      new Request('https://example.com/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ token: 'id-token' }),
      }),
    );
    expectPrivate(response, 200);
    expect(mocks.cookie).not.toHaveBeenCalled();
  });

  it('keeps failed cookie creation private and sets no cookie', async () => {
    mocks.idToken.mockRejectedValueOnce(new Error('invalid'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await renderEndpoint(
        async (ctx) => {
          const result = await POST(ctx);
          expect([...ctx.cookies.headers()]).toEqual([]);
          return result;
        },
        new Request('https://example.com/api/auth/session', {
          method: 'POST',
          body: JSON.stringify({ token: 'invalid' }),
        }),
      );
      expectPrivate(response, 401);
      expect(mocks.createCookie).not.toHaveBeenCalled();
      expect(mocks.cookie).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('deletes the cookie without verifying it and keeps the response private', async () => {
    const response = await renderEndpoint(
      async (ctx) => {
        const result = await DELETE(ctx);
        expect([...ctx.cookies.headers()][0]).toContain(
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
        return result;
      },
      new Request('https://example.com/api/auth/session', {
        method: 'DELETE',
        headers: { Cookie: 'session=A' },
      }),
    );
    expectPrivate(response, 200);
    expect(mocks.cookie).not.toHaveBeenCalled();
  });

  it('keeps bearer verification separate from the cookie resolver', async () => {
    const response = await renderEndpoint(
      async (ctx) => {
        const uid = await tokenToUid(ctx.request);
        return Response.json({ uid });
      },
      new Request('https://example.com/api/test', {
        headers: { Authorization: 'Bearer id-token', Cookie: 'session=A' },
      }),
    );
    expect(await response.json()).toEqual({ uid: 'bearer-user' });
    expect(mocks.idToken).toHaveBeenCalledExactlyOnceWith('id-token', true);
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
});
