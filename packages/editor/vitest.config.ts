import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

/**
 * The editor is the one package whose subject only exists in a document: a
 * CodeMirror view measures itself against a DOM before it will report anything.
 * So this suite runs in jsdom, where the design system's runs in Node — its
 * components render to a string and are read from the markup.
 */
export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },
});
