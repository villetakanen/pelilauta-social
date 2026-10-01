import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Read the opening post without JavaScript
 *     Given a public thread with a known public author, an available public
 *       profile destination, and a publication date
 *     When an anonymous reader opens the thread with JavaScript disabled
 *     Then the title, formatted body, attachments, author link, channel, and
 *       publication date render
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-opening-post-thread,
 * authored by the member whose profiles document the same script restores,
 * carrying one image attachment and three literal dates. Run it, with the dev
 * server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's OPENING_POST_THREAD_KEY and its fields.
const THREAD_KEY = 'e2e-opening-post-thread';
const THREAD_TITLE = 'E2E opening post regression thread';
const THREAD_BODY =
  'Seeded by e2e/reset-fixtures.mjs for the opening-post reading regressions.';
const IMAGE_URL =
  'https://storage.googleapis.com/skaldbase-test.appspot.com/e2e-fixtures/reply-attachment.jpg';
// Matches profiles/<memberUid>.nick, restored by the same reset script.
const AUTHOR_NICK = 'E2E Regression Member';
// src/locales/fi/threads.ts's info.createdAt, with the seeded creation day.
const PUBLICATION_LABEL = 'Luotu 2024-01-02';

test.use({ javaScriptEnabled: false });

test('Read the opening post without JavaScript', async ({ page }) => {
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

  const article = page.locator('article').first();
  await expect(article.locator('h1')).toHaveText(THREAD_TITLE);
  await expect(article.locator('.content-area')).toContainText(THREAD_BODY);
  await expect(article.locator(`img[src="${IMAGE_URL}"]`)).toBeAttached();

  const summary = page.locator('.thread-info .summary');
  const authorLink = summary.locator('a.cn-nick');
  await expect(authorLink).toHaveText(AUTHOR_NICK);
  await expect(authorLink).toHaveAttribute('href', /^\/profiles\//);
  await expect(summary.locator('a[href="/channels/yleinen"]')).toBeAttached();

  const published = summary.locator('time').first();
  await expect(published).toContainText(PUBLICATION_LABEL);
  await expect(published).toHaveAttribute(
    'datetime',
    '2024-01-02T09:00:00.000Z',
  );
});
