import type { APIContext } from 'astro';
import { createContext } from 'astro/middleware';
import { createComponent, render } from 'astro/runtime/server/index.js';
import { onRequest } from 'src/middleware';
import { checkSession } from 'src/utils/server/auth/verifySession';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createContainer,
  renderEndpoint,
  sessionRequest,
} from './helpers/renderWithMiddleware';

const firebase = vi.hoisted(() => ({
  loaded: vi.fn(),
  verify: vi.fn(),
}));
vi.mock('src/firebase/server', () => {
  firebase.loaded();
  return { serverAuth: { verifySessionCookie: firebase.verify } };
});
vi.mock('src/utils/logHelpers', () => ({ logDebug: vi.fn() }));

function context(cookie?: string) {
  return createContext({ request: sessionRequest(cookie), defaultLocale: '' });
}

async function throughMiddleware(
  ctx: APIContext,
  consume: () => Promise<Response>,
) {
  const response = await onRequest(ctx, consume);
  if (!(response instanceof Response))
    throw new Error('Middleware returned no response');
  return response;
}

beforeEach(() => {
  firebase.verify.mockReset();
});

describe('request-scoped session resolution', () => {
  it('installs without loading Firebase, verifying, or mutating cookies', async () => {
    const ctx = context('A');
    await throughMiddleware(ctx, async () => {
      expect(ctx.locals.resolveSession).toBeTypeOf('function');
      return new Response('public');
    });
    expect(firebase.loaded).not.toHaveBeenCalled();
    expect(firebase.verify).not.toHaveBeenCalled();
    expect([...ctx.cookies.headers()]).toEqual([]);
  });

  it('shares the in-flight promise and resolved result', async () => {
    let release!: (token: unknown) => void;
    firebase.verify.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const ctx = context('A');
    await throughMiddleware(ctx, async () => {
      const first = checkSession(ctx);
      const second = checkSession(ctx);
      expect(second).toBe(first);
      await vi.waitFor(() => expect(firebase.verify).toHaveBeenCalledTimes(1));
      release({ uid: 'A' });
      const result = await first;
      expect(await second).toBe(result);
      expect(checkSession(ctx)).toBe(first);
      expect(await checkSession(ctx)).toBe(result);
      return new Response('protected');
    });
    expect(firebase.verify).toHaveBeenCalledExactlyOnceWith('A', true);
  });

  it('isolates concurrent users and separate requests for the same cookie', async () => {
    const releases = new Map<string, (token: unknown) => void>();
    firebase.verify.mockImplementation(
      (cookie: string) =>
        new Promise((resolve) => {
          releases.set(cookie, resolve);
        }),
    );
    const a = context('A');
    const b = context('B');
    expect(a.locals).not.toBe(b.locals);
    const start = (ctx: APIContext) =>
      throughMiddleware(ctx, async () => {
        const result = await checkSession(ctx);
        return Response.json(result);
      });
    const first = start(a);
    await vi.waitFor(() => expect(firebase.verify).toHaveBeenCalledTimes(1));
    const second = start(b);
    await vi.waitFor(() => expect(firebase.verify).toHaveBeenCalledTimes(2));
    releases.get('B')?.({ uid: 'B' });
    releases.get('A')?.({ uid: 'A' });
    const responses = await Promise.all([first, second]);
    expect(await responses[0].json()).toEqual({
      status: 'verified',
      token: { uid: 'A' },
    });
    expect(await responses[1].json()).toEqual({
      status: 'verified',
      token: { uid: 'B' },
    });
    firebase.verify.mockResolvedValue({ uid: 'A' });
    const again = context('A');
    await throughMiddleware(again, async () => {
      await checkSession(again);
      return new Response('protected');
    });
    expect(firebase.verify).toHaveBeenCalledTimes(3);
  });

  it.each(['set', 'delete'] as const)(
    'captures the incoming cookie before %s and first resolution',
    async (mutation) => {
      firebase.verify.mockResolvedValue({ uid: 'A' });
      const ctx = context('A');
      await throughMiddleware(ctx, async () => {
        if (mutation === 'set') ctx.cookies.set('session', 'B');
        else ctx.cookies.delete('session');
        expect(await checkSession(ctx)).toEqual({
          status: 'verified',
          token: { uid: 'A' },
        });
        ctx.cookies.set('session', 'C');
        await checkSession(ctx);
        return new Response('protected');
      });
      expect(firebase.verify).toHaveBeenCalledExactlyOnceWith('A', true);
    },
  );

  it('does not authenticate an incoming request without a cookie after cookie creation', async () => {
    const ctx = context();
    await throughMiddleware(ctx, async () => {
      ctx.cookies.set('session', 'B');
      expect(await checkSession(ctx)).toEqual({ status: 'rejected' });
      return new Response('denied');
    });
    expect(firebase.verify).not.toHaveBeenCalled();
  });

  it.each([
    ['auth/session-cookie-revoked', 'rejected'],
    ['app/network-timeout', 'unavailable'],
    ['auth/internal-error', 'failed'],
  ])('memoizes %s without retrying', async (code, status) => {
    firebase.verify.mockImplementation(async () => {
      throw { code };
    });
    const ctx = context('A');
    await throughMiddleware(ctx, async () => {
      const first = checkSession(ctx);
      expect(checkSession(ctx)).toBe(first);
      expect(await first).toEqual({ status });
      expect(await checkSession(ctx)).toBe(await first);
      return new Response('denied');
    });
    expect(firebase.verify).toHaveBeenCalledTimes(1);
  });
});

describe('final response caching through Astro', () => {
  it('preserves identity-independent public responses without verification', async () => {
    const publicPage = createComponent((result) => {
      result.response.headers.set('Cache-Control', 'public, s-maxage=60');
      return render`<html>Public content</html>`;
    });
    const responses = await Promise.all(
      [undefined, 'A', 'B'].map(async (cookie) => {
        const container = await createContainer();
        return container.renderToResponse(publicPage, {
          request: sessionRequest(cookie, '/admin-looking-public-path'),
        });
      }),
    );
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<html>Public content</html>');
      expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60');
    }
    expect(firebase.verify).not.toHaveBeenCalled();
  });

  it.each([200, 401, 403, 500, 503, 302])(
    'overrides downstream cache headers for status %s',
    async (status) => {
      firebase.verify.mockResolvedValue({ uid: 'A' });
      const response = await renderEndpoint(async (ctx) => {
        await checkSession(ctx);
        return new Response(null, {
          status,
          headers: {
            'Cache-Control': 'public, s-maxage=60',
            'CDN-Cache-Control': 'public, s-maxage=600',
            'Netlify-CDN-Cache-Control': 'public, s-maxage=600',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
            'X-Preserved': 'yes',
            ...(status === 302 ? { Location: '/login' } : {}),
          },
        });
      }, sessionRequest('A'));
      expect(response.status).toBe(status);
      for (const name of [
        'Cache-Control',
        'CDN-Cache-Control',
        'Netlify-CDN-Cache-Control',
        'Vercel-CDN-Cache-Control',
      ]) {
        expect(response.headers.get(name)).toBe('no-store');
      }
      expect(response.headers.get('X-Preserved')).toBe('yes');
      if (status === 302)
        expect(response.headers.get('Location')).toBe('/login');
    },
  );

  it('handles immutable redirect headers', async () => {
    const response = await renderEndpoint(async (ctx) => {
      await checkSession(ctx);
      return Response.redirect('https://example.com/login');
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Location')).toBe('https://example.com/login');
  });
});
