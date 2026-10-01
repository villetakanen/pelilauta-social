import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root, gitignored, never in the app. See
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
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-reply-order-thread with
 * three replies — two sharing one creation time, the first of them carrying an
 * edit date later than every other date in the thread, and one stored with no
 * creation time at all. `ReplySchema` rejects that last record, so the
 * discussion renders without it and reports itself incomplete, the same path
 * malformed-reply-render.spec.ts covers for a record failing on `owners`. Run
 * the reset, with the dev server already up against skaldbase-test, before
 * this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's constants.
const THREAD_KEY = 'e2e-reply-order-thread';
const UNDATED_KEY = 'e2e-order-a-undated';
const EQUAL_A_KEY = 'e2e-order-b-equal-first';
const EQUAL_B_KEY = 'e2e-order-c-equal-second';
// src/locales/fi/threads.ts's discussion.incomplete — the default locale
// ('fi') applies with no locale negotiation in play.
const INCOMPLETE_LABEL = 'Osaa vastauksista ei voitu näyttää.';

const EXPECTED_ORDER = [EQUAL_A_KEY, EQUAL_B_KEY];

async function renderedReplyKeys(page: Page): Promise<string[]> {
  return page
    .locator('#discussion .replies > div')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
}

test('Order replies with equal creation dates', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // The server orders the replies: the initial document carries the order.
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(await renderedReplyKeys(page)).toEqual(EXPECTED_ORDER);
  await expect(page.locator(`#${UNDATED_KEY}`)).toHaveCount(0);
  await expect(page.locator('#discussion')).toContainText(INCOMPLETE_LABEL);

  // The client orders the replies: a signed-in reader's live subscription
  // reconciles every reply and reaches the same order.
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
  await expect(page.locator('#discussion')).toContainText(INCOMPLETE_LABEL);
});
