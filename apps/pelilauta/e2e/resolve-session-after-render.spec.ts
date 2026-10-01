import { expect, test } from '@playwright/test';
// Credentials live at the repository root, gitignored, never in the app. See
// e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Resolve a signed-in session after initial render
 *     Given server-rendered replies and an unresolved session
 *     When the session resolves to an active account
 *     Then live reply enhancement starts once
 *     And existing replies remain without duplicates
 *
 * The session is "unresolved" the ordinary way: on a fresh full-page
 * navigation, Firebase Auth restores a previously signed-in session from its
 * own persistence asynchronously, so `$isActive` in
 * src/threads/client/DiscussionSection.svelte starts false even though the
 * reader is already signed in, and the `$effect` at
 * DiscussionSection.svelte:32-37 — not `onMount` — is what starts the
 * subscription once it turns true. This spec signs in once, then loads the
 * thread page as a second, separate navigation, so that resolution happens
 * after the page has already rendered its server-prepared replies.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-initial-reply-render-thread
 * and its two replies, and the signed-in member's account and profile. Run it,
 * with the dev server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's REPLY_THREAD_KEY and reply keys.
const THREAD_KEY = 'e2e-initial-reply-render-thread';
const REPLY_1_KEY = 'e2e-reply-1';
const REPLY_2_KEY = 'e2e-reply-2';

test('Resolve a signed-in session after initial render', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // Sign in through the real login form, as onboarding-callout-transition.spec.ts does.
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  // A fresh, separate navigation: the page's own JavaScript boots again from
  // scratch, so session resolution happens after this document's initial
  // render, not carried over from the login page's already-resolved state.
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  // Server-rendered replies are present immediately, each exactly once.
  await expect(page.locator(`#${REPLY_1_KEY}`)).toHaveCount(1);
  await expect(page.locator(`#${REPLY_2_KEY}`)).toHaveCount(1);

  // Give the session time to resolve and live enhancement to start and
  // deliver its initial snapshot.
  await page.waitForTimeout(3000);

  // Existing replies remain without duplicates once live enhancement starts:
  // the initial onSnapshot delivers both replies as "added", and
  // DiscussionSection.svelte reconciles by reply key rather than appending.
  await expect(page.locator(`#${REPLY_1_KEY}`)).toHaveCount(1);
  await expect(page.locator(`#${REPLY_2_KEY}`)).toHaveCount(1);

  // Waiting longer still shows no further duplication — enhancement started
  // once, not repeatedly.
  await page.waitForTimeout(2000);
  await expect(page.locator(`#${REPLY_1_KEY}`)).toHaveCount(1);
  await expect(page.locator(`#${REPLY_2_KEY}`)).toHaveCount(1);
});
