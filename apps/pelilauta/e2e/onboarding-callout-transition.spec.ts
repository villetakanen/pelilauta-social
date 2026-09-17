import { expect, test } from '@playwright/test';
// Credentials live at the repository root, gitignored, never in the app. See
// e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Regression for the fix in
 * src/components/server/FrontPage/OnboardingCallout.astro: a signed-in reader
 * returning to the front page through a real Astro view transition must not
 * see the onboarding invitation reappear.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores the signed-in member (account +
 * profile) and the one public thread this spec follows a link to, both by
 * explicit document id. Run it, with the dev server already up against
 * skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY.
const THREAD_KEY = 'e2e-onboarding-regression-thread';

declare global {
  interface Window {
    __e2eWindowSurvived?: string;
    __e2eSwapDetected?: boolean;
  }
}

test('onboarding invitation stays hidden after a view-transition return to the front page', async ({
  page,
}) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // Sign in through the real login form.
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // The password login flow completes with a full navigation (authUtils.ts
  // calls `window.location.assign`), landing back on the front page.
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  const callout = page.locator('.onboarding-callout');
  await expect(callout).toBeAttached();
  await expect(callout).toBeHidden();

  // Follow a real link to the seeded thread — a view transition, not a
  // direct goto.
  const threadLink = page.locator(`a[href="/threads/${THREAD_KEY}"]`);
  await threadLink.waitFor({ state: 'visible' });
  await threadLink.click();
  await page.waitForURL(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  // Arm a detector before returning. A real Astro swap keeps this window
  // alive, so both the marker and the astro:after-swap listener survive the
  // navigation; a full reload would silently drop both, which is exactly
  // what would let the old bug hide undetected.
  await page.evaluate(() => {
    window.__e2eWindowSurvived = 'yes';
    window.__e2eSwapDetected = false;
    document.addEventListener(
      'astro:after-swap',
      () => {
        window.__e2eSwapDetected = true;
      },
      { once: true },
    );
  });

  // The application's identity link in the app bar (CnAppBar, href="/"),
  // not the rail's home entry, which is hidden above the small breakpoint.
  await page.locator('a.identity[href="/"]').click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  const survived = await page.evaluate(() => window.__e2eWindowSurvived);
  const sawSwap = await page.evaluate(() => window.__e2eSwapDetected);
  expect(
    survived,
    'the window was replaced — this was a full reload, not a view transition',
  ).toBe('yes');
  expect(sawSwap, 'astro:after-swap did not fire on the return trip').toBe(
    true,
  );

  // The regression: the callout must still exist and still be hidden after
  // the swap replaced the document's markup.
  await expect(callout).toBeAttached();
  await expect(callout).toBeHidden();
});
