// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// Source-level workspace link, mirrored by tsconfig.json paths.
const designSystem = fileURLToPath(
  new URL('../../packages/design-system', import.meta.url),
);

export default defineConfig({
  site: 'https://design.pelilauta.social',
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@design-system': designSystem,
      },
    },
  },
});
