import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

/**
 * Geometry is pure and reads fine from a string in Node, as the design
 * system's suite does. Clock's interaction — pointer clicks, long-
 * press timing, keyboard wrapping, focus — only exists once the component is
 * mounted, and mounting a Svelte component needs a document. So this suite
 * runs in jsdom, as the editor's does.
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
