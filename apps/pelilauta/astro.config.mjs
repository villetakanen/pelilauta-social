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

  output: 'server',

  vite: {
    resolve: {
      alias: {
        '@design-system': fileURLToPath(
          new URL('../../packages/design-system', import.meta.url),
        ),
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
      noExternal: [
        'nanostores',
        '@nanostores/persistent',
        '@astrojs/netlify',
        'firebase',
      ],
    },
  },

  adapter: netlify({
    edgeMiddleware: false,
  }),
});
