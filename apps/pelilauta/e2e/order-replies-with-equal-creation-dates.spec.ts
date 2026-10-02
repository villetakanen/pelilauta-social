import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root outside the app. Refer to
// e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Order replies with equal creation dates
 *     Given replies with identical creation times
 *     When the server or client orders the replies
 *     Then identical creation times sort by key
 *     And edit times do not alter order
 *     And a reply without a creation time does not appear
 *
 * `e2e/reset-fixtures.mjs` restores `stream/e2e-reply-order-thread` with three
 * replies: two share a creation timestamp, the first carries an edit date later
 * than all other dates in the thread, and the third contains no creation
 * timestamp. The ordered query excludes the undated record, preventing it from
 * reaching the parser and rendering. Run the reset against `skaldbase-test`
 * before executing this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches constants defined in e2e/reset-fixtures.mjs.
const THREAD_KEY = 'e2e-reply-order-thread';
const UNDATED_KEY = 'e2e-order-a-undated';
const EQUAL_A_KEY = 'e2e-order-b-equal-first';
const EQUAL_B_KEY = 'e2e-order-c-equal-second';
const EXPECTED_ORDER = [EQUAL_A_KEY, EQUAL_B_KEY];

async function renderedReplyKeys(page: Page): Promise<string[]> {
  return page
    .locator('#discussion .replies > div')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
}

test('Order replies with equal creation dates', async ({ page }) => {
  // Verify the test environment before proceeding, mirroring the guard in the
  // reset script.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // The server orders the replies; the initial document carries the reading order.
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(await renderedReplyKeys(page)).toEqual(EXPECTED_ORDER);
  await expect(page.locator(`#${UNDATED_KEY}`)).toHaveCount(0);

  // The client orders replies through the live subscription of the signed-in
  // reader, matching server order.
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
  await page.waitForTimeout(4000);
  expect(await renderedReplyKeys(page)).toEqual(EXPECTED_ORDER);
  await expect(page.locator(`#${UNDATED_KEY}`)).toHaveCount(0);
});
