import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Runs the seed model's own unit tests: `uat/pelilauta/e2e/seed-model.ts`
 * resolves placeholders, validates seed relationships and derives the tag
 * index with no credentials and no network. `vitest.config.ts` always runs
 * `global-setup.ts`, which resets the acceptance database, so these tests
 * cannot ride that config — this one carries no globalSetup.
 */
export default defineConfig({
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./apps/pelilauta/src', import.meta.url)),
      // `toTagData.ts`, which `seed-model.ts` reuses, resolves its own
      // imports through the app's `@schemas`/`@utils` aliases rather than
      // the bare `src/` specifiers the seed scripts use.
      '@schemas': fileURLToPath(
        new URL('./apps/pelilauta/src/schemas', import.meta.url),
      ),
      '@utils': fileURLToPath(
        new URL('./apps/pelilauta/src/utils', import.meta.url),
      ),
    },
  },
  test: {
    include: ['uat/**/*.test.ts'],
  },
});
