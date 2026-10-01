import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/replies/spec.md:
 *
 *   Scenario: Encounter a malformed reply
 *     Given a thread with valid replies and one malformed record
 *     When the discussion renders or updates
 *     Then valid replies remain readable
 *     And the discussion indicates incomplete content
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-malformed-reply-thread
 * with one valid reply and one reply document failing ReplySchema's `owners`
 * minimum (`owners: []`) on purpose. Per e2e/README.md and this task's
 * fixture note, it lives on its own thread: fetchDiscussion marks a thread
 * `incomplete` for its whole lifetime once a malformed record exists in it,
 * so no other spec's thread carries one. Run reset-fixtures.mjs, with the dev
 * server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's MALFORMED_* constants.
const THREAD_KEY = 'e2e-malformed-reply-thread';
const VALID_REPLY_KEY = 'e2e-malformed-thread-valid-reply';
const MALFORMED_REPLY_KEY = 'e2e-malformed-reply';
// src/locales/fi/threads.ts's discussion.incomplete — the default locale
// ('fi') applies with no locale negotiation in play.
const INCOMPLETE_LABEL = 'Osaa vastauksista ei voitu näyttää.';

test.use({ javaScriptEnabled: false });

test('Encounter a malformed reply', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  // Valid replies remain readable.
  const validReply = page.locator(`#${VALID_REPLY_KEY}`);
  await expect(validReply).toBeAttached();
  await expect(validReply.locator('.content-area')).toContainText(
    'A valid reply beside the malformed record.',
  );

  // The malformed record itself never renders as a reply article.
  await expect(page.locator(`#${MALFORMED_REPLY_KEY}`)).toHaveCount(0);

  // The discussion indicates incomplete content.
  await expect(page.locator('#discussion')).toContainText(INCOMPLETE_LABEL);
});
