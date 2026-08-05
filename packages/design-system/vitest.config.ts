import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { optionalProprietary } from './vite/optional-proprietary.mjs';

export default defineConfig({
  plugins: [
    svelte(),
    optionalProprietary(
      new URL('../myrrys-proprietary/index.ts', import.meta.url),
    ),
  ],
});
