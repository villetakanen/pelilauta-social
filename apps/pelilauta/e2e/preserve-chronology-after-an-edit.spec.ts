import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root, gitignored, never in the app. See
// e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Preserve chronology after an edit
 *     Given replies A and B where creation of A precedes B
 *     When A is edited after creation of B
 *     Then A precedes B in live views and after reloads
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-reply-chronology-thread
 * with reply A created 2024-04-01, reply B created 2024-04-02, and A edited
 * 2024-04-03 — A's stored flowTime carrying that edit, so only creation time
 * puts A first. Run the reset, with the dev server already up against
 * skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's constants.
const THREAD_KEY = 'e2e-reply-chronology-thread';
const REPLY_A_KEY = 'e2e-chronology-reply-a';
const REPLY_B_KEY = 'e2e-chronology-reply-b';

async function renderedReplyKeys(page: Page): Promise<string[]> {
  return page
    .locator('#discussion .replies > div')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
}

test('Preserve chronology after an edit', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // Sign in, so the discussion runs its live subscription.
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(await renderedReplyKeys(page)).toEqual([REPLY_A_KEY, REPLY_B_KEY]);

  // The live view: the subscription's first snapshot reconciles both replies,
  // and A still precedes B.
  await page.waitForTimeout(4000);
  expect(await renderedReplyKeys(page)).toEqual([REPLY_A_KEY, REPLY_B_KEY]);

  // After a reload, the server read agrees with the live view.
  await page.reload({ waitUntil: 'domcontentloaded' });
  expect(await renderedReplyKeys(page)).toEqual([REPLY_A_KEY, REPLY_B_KEY]);
});
