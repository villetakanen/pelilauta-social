// @ts-check
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { optionalProprietary } from '../../packages/design-system/vite/optional-proprietary.mjs';
import { tokenWatch } from '../../packages/design-system/vite/token-watch.mjs';

const designSystem = fileURLToPath(
  new URL('../../packages/design-system', import.meta.url),
);
const editor = fileURLToPath(new URL('../../packages/editor', import.meta.url));

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
        '@editor': editor,
      },
    },
    plugins: [
      optionalProprietary(
        new URL('../../packages/myrrys-proprietary/index.ts', import.meta.url),
      ),
      // Editing a token JSON regenerates styles/*.css while dev runs, so a
      // reload shows the new value without a by-hand generate:tokens.
      tokenWatch(),
    ],
  },
});
