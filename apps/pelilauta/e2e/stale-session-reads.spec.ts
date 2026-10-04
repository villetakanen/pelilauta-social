import { expect, test } from '@playwright/test';

/**
 * The constraint "an unresolved session establishes no subscription" in
 * specs/pelilauta/threads/replies/spec.md, and the matching success criterion
 * of #165 for reaction reads.
 *
 * Persisted session state names a user that Firebase never confirms. The
 * signal is the Firestore web SDK's Listen channel: a reply listener is a
 * request whose body names `stream/<thread>` and `comments`; a reaction read
 * names `reactions/`.
 *
 * Fixture: the thread seeded by e2e/reset-fixtures.mjs.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY.
const THREAD_KEY = 'e2e-onboarding-regression-thread';

test('a persisted session Firebase has not confirmed opens no reply subscription and reads no reaction', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('session-state', 'active');
    localStorage.setItem('session-uid', 'stale-e2e-uid');
  });

  const replyListens: string[] = [];
  const reactionReads: string[] = [];
  page.on('request', (request) => {
    if (!request.url().includes('google.firestore.v1.Firestore/')) return;
    let body = request.postData() ?? '';
    try {
      body = decodeURIComponent(body);
    } catch {
      // keep the raw body
    }
    if (
      request.url().includes('Firestore/Listen') &&
      body.includes(`stream/${THREAD_KEY}`) &&
      body.includes('comments')
    ) {
      replyListens.push(request.url());
    }
    if (body.includes('reactions/')) reactionReads.push(request.url());
  });

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`);
  await page.waitForTimeout(3000);

  expect(replyListens).toHaveLength(0);
  expect(reactionReads).toHaveLength(0);
});
