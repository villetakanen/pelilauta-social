import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Omit unknown structured-data authors
 *     Given a rendered contribution without a resolvable public author
 *     When the server prepares discovery metadata
 *     Then structured data omits the entire contribution item
 *     And an opening post without a resolvable author omits the entire
 *       discussion graph
 *     And visible anonymous attribution renders
 *
 * Fixtures: e2e/reset-fixtures.mjs restores
 * stream/e2e-no-profile-author-thread, owned by an uid for which it deletes
 * any profiles document, so getPublicProfiles resolves no attribution for the
 * opening post. Run it, with the dev server already up against
 * skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's NO_PROFILE_THREAD_KEY and author uid.
const THREAD_KEY = 'e2e-no-profile-author-thread';
const NO_PROFILE_AUTHOR_UID = 'e2e-ghost-author-uid';
// src/locales/fi/app.ts's meta.anonymous — the default locale ('fi') applies
// with no locale negotiation in play.
const ANONYMOUS_LABEL = 'Nimetön';

test.use({ javaScriptEnabled: false });

test('Omit unknown structured-data authors', async ({ page }) => {
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

  // An opening post without a resolvable author omits the entire graph, so
  // no structured-data item names an author the application cannot resolve.
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0,
  );
  await expect(page.locator('body')).not.toContainText(NO_PROFILE_AUTHOR_UID);

  // Visible anonymous attribution renders.
  await expect(page.locator('.thread-info .summary')).toContainText(
    ANONYMOUS_LABEL,
  );
});
