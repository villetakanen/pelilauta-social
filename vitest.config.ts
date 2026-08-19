import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * The acceptance suite's runner. `docs/ACCEPTANCE_TESTING.md` states the model.
 *
 * The root project holds only this suite. `pnpm test` runs `pnpm -r`, which
 * excludes the workspace root, so `pnpm verify` does not reach it — the
 * decision `plans/debt/browser-tests-run-locally-only.md` records.
 */
export default defineConfig({
  /*
   * The application's bare `src/` specifiers, resolved the way its Astro
   * build resolves them. A spec reads the reader-facing copy through
   * `src/utils/i18n` rather than repeating it, for the same reason
   * `docs/acceptance-testing-seed.md` gives for the seed's schema imports.
   */
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./apps/pelilauta/src', import.meta.url)),
    },
  },
  test: {
    include: ['uat/pelilauta/e2e/**/*.spec.ts'],
    globalSetup: ['uat/pelilauta/e2e/global-setup.ts'],
    // Every spec shares one database, so they run one at a time.
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    // A journey drives a real browser against a dev server that compiles on
    // demand; the first navigation of a route is the slow one.
    testTimeout: 120_000,
    hookTimeout: 180_000,
    // Reset, seed, sign-in and a cold dev server all happen before the first spec.
    teardownTimeout: 30_000,
  },
});
