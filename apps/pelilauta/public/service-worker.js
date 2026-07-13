importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js',
);

// Enable immediate activation
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Clean up old caches
workbox.precaching.cleanupOutdatedCaches();

// Set up precaching
let precache = self.__WB_MANIFEST;
if (!precache) precache = [{ revision: null, url: 'index.html' }];

workbox.precaching.precacheAndRoute([
  ...precache,
  { url: '/offline.html', revision: '1' },
]);

// Cache API routes with network-first strategy
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  }),
);

// Cache images with cache-first strategy
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  }),
);

// Cache Firebase Storage images
workbox.routing.registerRoute(
  ({ url }) => url.hostname === 'firebasestorage.googleapis.com',
  new workbox.strategies.CacheFirst({
    cacheName: 'firebase-images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  }),
);

// Cache CSS and JS with stale-while-revalidate
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'style' || request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  }),
);

// Cache pages with network-first strategy
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  }),
);

// Background sync for failed POST requests (Workbox 7 syntax)
const { BackgroundSyncPlugin } = workbox.backgroundSync;
const { NetworkOnly } = workbox.strategies;

workbox.routing.registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method === 'POST',
  new NetworkOnly({
    plugins: [
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60, // Retry for max of 24 hours
      }),
    ],
  }),
);

// Offline fallback
workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/offline.html');
  }

  return Response.error();
});
