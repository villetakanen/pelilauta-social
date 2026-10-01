import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Read a post without an author profile
 *     Given a public thread without a resolvable public author profile
 *     When the thread renders
 *     Then the opening post remains readable
 *     And attribution displays the localized anonymous-author label
 *     And no account identifier appears as an author name
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-no-profile-author-thread,
 * owned by NO_PROFILE_AUTHOR_UID, and deletes any profiles/<that uid> document,
 * so getPublicProfiles resolves no attribution for it. Run reset-fixtures.mjs,
 * with the dev server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's NO_PROFILE_THREAD_KEY and author uid.
const THREAD_KEY = 'e2e-no-profile-author-thread';
const NO_PROFILE_AUTHOR_UID = 'e2e-ghost-author-uid';
// src/locales/fi/app.ts's meta.anonymous — the default locale ('fi') applies
// with no locale negotiation in play.
const ANONYMOUS_LABEL = 'Nimetön';

test.use({ javaScriptEnabled: false });

test('Read a post without an author profile', async ({ page }) => {
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

  // The opening post remains readable: title and body render.
  const article = page.locator('article').first();
  await expect(article).toBeAttached();
  await expect(article.locator('.content-area')).toContainText(
    'Seeded by e2e/reset-fixtures.mjs for the no-profile-author-reads regression.',
  );

  // Attribution displays the localized anonymous-author label, in the
  // thread-info summary ThreadInfoSection.astro renders.
  const summary = page.locator('.thread-info .summary');
  await expect(summary).toContainText(ANONYMOUS_LABEL);

  // No account identifier appears as an author name: the ghost uid is never
  // printed as visible text, and no profile link points at it.
  await expect(page.locator('body')).not.toContainText(NO_PROFILE_AUTHOR_UID);
  await expect(
    page.locator(`a[href="/profiles/${NO_PROFILE_AUTHOR_UID}"]`),
  ).toHaveCount(0);
});
