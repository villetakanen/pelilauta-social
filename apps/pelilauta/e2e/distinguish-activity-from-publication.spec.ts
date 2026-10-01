import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Distinguish activity from publication
 *     Given a thread published on one day and active on a later day
 *     When the dates render
 *     Then the publication date identifies opening-post creation
 *     And the displayed activity date indicates activity
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-opening-post-thread
 * with a creation day, a later edit day, and a later activity day, all
 * literal rather than server timestamps. Run it, with the dev server already
 * up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's OPENING_POST_THREAD_KEY and its dates.
const THREAD_KEY = 'e2e-opening-post-thread';
// src/locales/fi/threads.ts's info.createdAt, info.updatedAt and info.flowTime.
const PUBLICATION_LABEL = 'Luotu 2024-01-02';
const EDIT_LABEL = 'Muokattu 2024-03-04';
const ACTIVITY_LABEL = 'Päivitetty 2024-05-06';

test.use({ javaScriptEnabled: false });

test('Distinguish activity from publication', async ({ page }) => {
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

  const dates = page.locator('.thread-info .summary time');
  await expect(dates).toHaveCount(3);

  // Each date names what it means, and carries its machine-readable value.
  await expect(dates.nth(0)).toContainText(PUBLICATION_LABEL);
  await expect(dates.nth(0)).toHaveAttribute(
    'datetime',
    '2024-01-02T09:00:00.000Z',
  );
  await expect(dates.nth(1)).toContainText(EDIT_LABEL);
  await expect(dates.nth(1)).toHaveAttribute(
    'datetime',
    '2024-03-04T09:00:00.000Z',
  );
  await expect(dates.nth(2)).toContainText(ACTIVITY_LABEL);
  await expect(dates.nth(2)).toHaveAttribute(
    'datetime',
    '2024-05-06T09:00:00.000Z',
  );
});
