import { expect, test } from '@playwright/test';

/**
 * Scenario "Read all replies without JavaScript" in
 * specs/pelilauta/threads/replies/spec.md.
 *
 * Fixture: the thread and its three replies seeded by e2e/reset-fixtures.mjs;
 * the second reply carries the image. Each reply names its seeded author.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY and REPLIES.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
// Matches the fixture member's nick in e2e/reset-fixtures.mjs.
const AUTHOR_NICK = 'E2E Regression Member';
const REPLIES = [
  { key: 'e2e-reply-1', body: 'First seeded reply body.' },
  { key: 'e2e-reply-2', body: 'Second seeded reply body.' },
  { key: 'e2e-reply-3', body: 'Third seeded reply body.' },
];

test('an anonymous reader reads all replies without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`);

  // The reply's anchor is the element holding the article.
  for (const reply of REPLIES) {
    const article = page.locator(`[id="${reply.key}"] article`);
    await expect(article).toHaveCount(1);
    await expect(article).toContainText(reply.body);
    const nick = article.getByRole('link', { name: AUTHOR_NICK });
    await expect(nick).toHaveCount(1);
    await expect(nick).toHaveAttribute('href', /^\/profiles\//);
  }
  await expect(
    page.locator('[id="e2e-reply-2"] article img').first(),
  ).toBeAttached();

  await context.close();
});
