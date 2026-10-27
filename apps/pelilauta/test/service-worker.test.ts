import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';

type CachePlugin = {
  cacheWillUpdate?: (input: { response: Response }) => Response | null;
  cachedResponseWillBeUsed?: (input: {
    cachedResponse?: Response;
  }) => Response | null;
};
const routes: {
  match: (input: unknown) => boolean;
  handler: Strategy;
  method?: string;
}[] = [];
class Strategy {
  constructor(
    public options: { cacheName?: string; plugins?: CachePlugin[] },
  ) {}
}
const noop = () => {};
runInNewContext(
  readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8'),
  {
    importScripts: noop,
    self: { __WB_MANIFEST: [] },
    workbox: {
      core: { skipWaiting: noop, clientsClaim: noop },
      precaching: { cleanupOutdatedCaches: noop, precacheAndRoute: noop },
      routing: {
        registerRoute: (
          match: (input: unknown) => boolean,
          handler: Strategy,
          method?: string,
        ) => routes.push({ match, handler, method }),
        setCatchHandler: noop,
      },
      strategies: {
        NetworkFirst: Strategy,
        NetworkOnly: Strategy,
        CacheFirst: Strategy,
        StaleWhileRevalidate: Strategy,
      },
      expiration: { ExpirationPlugin: Strategy },
      backgroundSync: { BackgroundSyncPlugin: Strategy },
    },
  },
);

for (const cache of ['pages-cache', 'api-cache']) {
  const plugins = routes.find(
    ({ handler }) => handler.options.cacheName === cache,
  )?.handler.options.plugins;
  const plugin = plugins?.find((candidate) => candidate.cacheWillUpdate);
  test.each([
    'no-store',
    'private, max-age=60',
    'NO-STORE',
    'public, no-store',
  ])(`${cache} neither stores nor serves %s responses`, (cacheControl) => {
    const response = new Response('personalized', {
      headers: { 'Cache-Control': cacheControl },
    });
    expect(plugin?.cacheWillUpdate?.({ response })).toBeNull();
    expect(
      plugin?.cachedResponseWillBeUsed?.({ cachedResponse: response }),
    ).toBeNull();
  });
  test.each([401, 500, 503])(
    `${cache} excludes failure status %i`,
    (status) => {
      const response = new Response('recovery', { status });
      expect(plugin?.cacheWillUpdate?.({ response })).toBeNull();
      expect(
        plugin?.cachedResponseWillBeUsed?.({ cachedResponse: response }),
      ).toBeNull();
    },
  );
  test(`${cache} retains public content and handles cache misses`, () => {
    const response = new Response('public', {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
    expect(plugin?.cacheWillUpdate?.({ response })).toBe(response);
    expect(
      plugin?.cachedResponseWillBeUsed?.({ cachedResponse: response }),
    ).toBe(response);
    expect(plugin?.cachedResponseWillBeUsed?.({})).toBeNull();
  });
}

test('session requests bypass both API caching and background replay', () => {
  const api = routes.find(
    ({ handler }) => handler.options.cacheName === 'api-cache',
  );
  const input = {
    url: new URL('https://example.com/api/auth/session'),
    request: { method: 'POST', mode: 'cors', destination: '' },
  };
  expect(api?.match(input)).toBe(false);
  for (const route of routes) expect(route.match(input)).toBe(false);
});
