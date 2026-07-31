// @ts-check
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { optionalProprietary } from '../../packages/design-system/vite/optional-proprietary.mjs';

const designSystem = fileURLToPath(
  new URL('../../packages/design-system', import.meta.url),
);

export default defineConfig({
  site: 'https://design.pelilauta.social',

  // 4322 leaves 4321 to apps/pelilauta; see the note in its config.
  server: { port: 4322 },

  output: 'static',
  integrations: [svelte(), mdx()],
  vite: {
    resolve: {
      alias: {
        '@design-system': designSystem,
      },
    },
    plugins: [
      optionalProprietary(
        new URL('../../packages/myrrys-proprietary/index.ts', import.meta.url),
      ),
    ],
  },
});
