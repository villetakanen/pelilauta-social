import { fileURLToPath } from 'node:url';
import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';
import tsconfigPaths from 'vite-tsconfig-paths';
import { optionalProprietary } from '../../packages/design-system/vite/optional-proprietary.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],

  // Pinned so the two apps keep the same ports when the root `dev` script runs
  // them in parallel. Unpinned, both ask for 4321 and the loser silently takes
  // 4322, so neither address is knowable in advance.
  server: { port: 4321 },

  output: 'server',

  vite: {
    resolve: {
      alias: {
        '@design-system': fileURLToPath(
          new URL('../../packages/design-system', import.meta.url),
        ),
        '@editor': fileURLToPath(
          new URL('../../packages/editor', import.meta.url),
        ),
        '@dice': fileURLToPath(new URL('../../packages/dice', import.meta.url)),
      },
    },
    plugins: [
      optionalProprietary(
        new URL('../../packages/myrrys-proprietary/index.ts', import.meta.url),
      ),
      tsconfigPaths(),
      visualizer({
        emitFile: true,
        filename: 'stats.html',
      }),
    ],
    optimizeDeps: {
      include: ['nanostores', '@nanostores/persistent', 'zod'],
      exclude: [
        'firebase/firestore',
        'firebase/auth',
        'firebase/storage',
        'firebase/app',
      ],
    },
    ssr: {
      // `firebase` is the *client* SDK. It reaches the server graph because
      // Astro server-renders islands, and islands import `@stores/session`,
      // which imports `src/firebase/client`. Left external, the deployed
      // Netlify function had to resolve `firebase` from its own node_modules at
      // runtime — and when a deploy shipped without that package, every SSR
      // route failed with ERR_MODULE_NOT_FOUND. Bundling it into the server
      // output removes that runtime resolution entirely. `firebase-admin` stays
      // external on purpose: it has native and dynamic requires that must not
      // be bundled.
      /*
       * Everything the SSR output imports has to be resolvable inside the
       * deployed function. The adapter's traced node_modules did not cover these,
       * and `scripts/check-netlify-ssr-entry.mjs` now fails the build when an
       * external is unresolvable rather than letting it 500 in production.
       *
       * All of these are pure JS and safe to bundle. `firebase-admin` is
       * deliberately absent: native and dynamic requires must stay external.
       */
      noExternal: [
        'nanostores',
        '@nanostores/persistent',
        '@astrojs/netlify',
        'firebase',
        'marked',
        'marked-footnote',
        'uuid',
      ],
      /*
       * Keep firebase-admin and its transitive deps out of the SSR bundle.
       * @grpc/grpc-js is CommonJS and uses __dirname to locate native proto
       * files; bundled into an ESM chunk that becomes undefined and the first
       * Firestore call fails. Staying external means Node resolves it from
       * node_modules at runtime, which is what the [functions.ssr]
       * external_node_modules block in netlify.toml ships. Adopted from v20.
       */
      external: [
        'firebase-admin',
        'firebase-admin/app',
        'firebase-admin/auth',
        'firebase-admin/firestore',
        'firebase-admin/storage',
      ],
    },
  },

  adapter: netlify({
    edgeMiddleware: false,
  }),
});
