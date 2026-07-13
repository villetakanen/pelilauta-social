import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],

  output: 'server',

  vite: {
    plugins: [
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
      noExternal: ['nanostores', '@nanostores/persistent'],
    },
  },

  adapter: netlify({
    edgeMiddleware: false,
  }),
});
