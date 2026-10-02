import { defineConfig, devices } from '@playwright/test';

/**
 * The replacement app feature suite: one maintained regression, run
 * independently of release acceptance. See e2e/README.md.
 *
 * `pnpm --filter pelilauta test:e2e` seeds fixtures then invokes Playwright
 * with no arguments, so this config is the only thing standing between that
 * command and running every file in `testDir` — `testMatch` pins it to the
 * named regression specs explicitly, so adding a stray file to `e2e/`
 * cannot silently widen what the command runs.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'onboarding-callout-transition.spec.ts',
    'initial-reply-render.spec.ts',
    'no-profile-author-reads.spec.ts',
    'compose-thread-page.spec.ts',
    'anonymous-visitor-live-reading.spec.ts',
    'resolve-session-after-render.spec.ts',
    'malformed-reply-render.spec.ts',
    'reply-permalink-navigation.spec.ts',
    'latest-reply-navigation.spec.ts',
    'read-opening-post.spec.ts',
    'distinguish-activity-from-publication.spec.ts',
    'inspect-discovery-metadata.spec.ts',
    'preserve-unknown-publication-dates.spec.ts',
    'omit-unknown-structured-data-authors.spec.ts',
    'preserve-chronology-after-an-edit.spec.ts',
    'order-replies-with-equal-creation-dates.spec.ts',
    'preserve-passage-position.spec.ts',
    're-anchor-viewport-at-a-scroll-boundary.spec.ts',
    'shorten-the-page-above-a-surviving-target.spec.ts',
    'terminate-a-live-subscription.spec.ts',
  ],
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
