import type { APIRoute, RouteData } from 'astro';
import { App } from 'astro/app';
import { createComponent } from 'astro/runtime/server/index.js';
import { requireAdmin } from 'src/admin/utils/requireAdmin';
import { onRequest } from 'src/middleware';
import { POST } from 'src/pages/api/auth/session';
import { checkSession } from 'src/utils/server/auth/verifySession';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ verify: vi.fn(), admin: vi.fn() }));
vi.mock('src/firebase/server', () => ({
  serverAuth: { verifySessionCookie: mocks.verify },
}));
vi.mock('src/firebase/server/admin', () => ({ isAdmin: mocks.admin }));
vi.mock('src/utils/logHelpers', () => ({ logDebug: vi.fn() }));

function application(page: Record<string, unknown>, type: RouteData['type']) {
  const routeData: RouteData = {
    route: '/test',
    component: 'test-route',
    type,
    pattern: /^\/test\/?$/,
    params: [],
    segments: [[{ content: 'test', dynamic: false, spread: false }]],
    prerender: false,
    fallbackRoutes: [],
    distURL: [],
    origin: 'project',
    isIndex: false,
  };
  const manifest = {
    rootDir: new URL('file:///test/'),
    base: '/',
    trailingSlash: 'ignore',
    buildFormat: 'directory',
    serverLike: true,
    routes: [{ routeData, scripts: [], styles: [], links: [] }],
    pageMap: new Map([
      ['test-route', async () => ({ page: async () => page })],
    ]),
    middleware: () => ({ onRequest }),
    renderers: [],
    clientDirectives: new Map(),
    componentMetadata: new Map(),
    inlinedScripts: new Map(),
    serverIslandMappings: new Map(),
    assets: new Set(),
    entryModules: {},
    allowedDomains: [],
    logLevel: 'silent',
    adapterName: 'test',
  } as unknown as ConstructorParameters<typeof App>[0];
  return new App(manifest, false);
}

function request(method = 'GET', body?: string) {
  return new Request('https://example.com/test', {
    method,
    headers: { Cookie: 'session=A', 'Content-Type': 'application/json' },
    body,
  });
}

async function expectPrivateError(response: Response) {
  expect(response.status).toBe(500);
  expect(await response.text()).toBe('Internal Server Error');
  for (const name of [
    'Cache-Control',
    'CDN-Cache-Control',
    'Netlify-CDN-Cache-Control',
    'Vercel-CDN-Cache-Control',
  ]) {
    expect(response.headers.get(name)).toBe('no-store');
  }
  expect(response.headers.get('Set-Cookie')).toBeNull();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockResolvedValue({ uid: 'A' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('authentication-dependent throws through Astro App dispatch', () => {
  it('returns a private generic 500 for malformed session POST JSON without verifying', async () => {
    const app = application({ POST }, 'endpoint');
    await expectPrivateError(await app.render(request('POST', '{')));
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      'Authentication-dependent request failed:',
      expect.any(SyntaxError),
    );
  });

  it('reports a thrown administrator guard without changing it to an auth denial', async () => {
    const error = new Error('private guard failure');
    mocks.admin.mockRejectedValueOnce(error);
    const GET: APIRoute = async (ctx) =>
      (await requireAdmin(ctx)) ?? new Response('protected');
    const app = application({ GET }, 'endpoint');
    await expectPrivateError(await app.render(request()));
    expect(mocks.verify).toHaveBeenCalledExactlyOnceWith('A', true);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      'Authentication-dependent request failed:',
      error,
    );
  });

  it('handles a page throw after session resolution before rendering a body', async () => {
    const error = new Error('private page failure');
    const page = createComponent(async (result, props, slots) => {
      await checkSession(result.createAstro(props, slots));
      throw error;
    });
    const app = application({ default: page }, 'page');
    const outerError = vi.spyOn(app, 'renderError');
    const response = await app.render(request());
    expect(outerError).not.toHaveBeenCalled();
    await expectPrivateError(response);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      'Authentication-dependent request failed:',
      error,
    );
  });

  it('leaves public throws to Astro rather than returning the private fallback', async () => {
    const error = new Error('public failure');
    const GET: APIRoute = () => {
      throw error;
    };
    const app = application({ GET }, 'endpoint');
    const outerError = vi.spyOn(app, 'renderError');
    const response = await app.render(request());
    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBeNull();
    expect(await response.text()).toBe('');
    expect(outerError).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ status: 500, error }),
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});
