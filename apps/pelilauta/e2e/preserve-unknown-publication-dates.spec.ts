import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Preserve unknown publication dates
 *     Given persisted content with a missing or invalid creation date
 *     When the server prepares the document
 *     Then the document omits the publication date
 *     And the server omits the structured-data item
 *     And the content remains readable
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-undated-thread, a
 * public thread stored with no createdAt and no updatedAt field, carrying
 * only an activity time. Run it, with the dev server already up against
 * skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's UNDATED_THREAD_KEY and its fields.
const THREAD_KEY = 'e2e-undated-thread';
const THREAD_BODY =
  'Seeded by e2e/reset-fixtures.mjs for the preserve-unknown-publication-dates regression.';
// src/locales/fi/threads.ts's info.createdAt and info.flowTime.
const PUBLICATION_WORD = 'Luotu';
const ACTIVITY_LABEL = 'Päivitetty 2024-07-08';

test.use({ javaScriptEnabled: false });

test('Preserve unknown publication dates', async ({ page }) => {
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

  // The document omits the publication date, rather than standing in a
  // placeholder or the time of the read.
  const summary = page.locator('.thread-info .summary');
  await expect(summary).not.toContainText(PUBLICATION_WORD);
  const dates = summary.locator('time');
  await expect(dates).toHaveCount(1);
  await expect(dates.first()).toContainText(ACTIVITY_LABEL);

  // The server omits the structured-data item: the opening post is the
  // graph's root, so no graph is emitted at all.
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0,
  );

  // The content remains readable.
  await expect(
    page.locator('article').first().locator('.content-area'),
  ).toContainText(THREAD_BODY);
});
