import { defineConfig, devices } from '@playwright/test';

/**
 * The replacement app feature suite: one maintained regression, run
 * independently of release acceptance. See e2e/README.md.
 *
 * `pnpm --filter pelilauta test:e2e` seeds fixtures then invokes Playwright
 * with no arguments, so this config is the only thing standing between that
 * command and running every file in `testDir` — `testMatch` pins it to the
 * single regression spec explicitly, so adding a stray file to `e2e/` cannot
 * silently widen what the command runs.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'onboarding-callout-transition.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // No retries initially: a flaky pass would hide a real regression.
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['github']] : [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    // Failure traces on; this suite is small enough that always-on tracing
    // is not run-time worth avoiding, but retain-on-failure keeps output lean.
    trace: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
