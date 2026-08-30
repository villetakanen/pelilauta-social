import { defineConfig } from 'vitest/config';

/**
 * Dice is CSS-only: no component, no client code. Its suite reads the
 * stylesheet as text and computes contrast from the parsed declarations, so
 * it runs in Node, as the design system's own suite does — no DOM is ever
 * needed.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
