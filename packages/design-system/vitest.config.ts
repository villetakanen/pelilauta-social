import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { optionalProprietary } from './vite/optional-proprietary.mjs';

export default defineConfig({
  // Svelte exports `mount` under the `browser` condition; tests mounting a
  // component into jsdom require the condition. Server-render tests import
  // `svelte/server`, which ignores the condition and receives the same markup.
  resolve: { conditions: ['browser'] },
  plugins: [
    svelte(),
    optionalProprietary(
      new URL('../myrrys-proprietary/index.ts', import.meta.url),
    ),
  ],
});
