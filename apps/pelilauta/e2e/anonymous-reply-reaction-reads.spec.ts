import { expect, test } from '@playwright/test';

/**
 * The anonymous-reading constraint in specs/pelilauta/threads/replies/spec.md:
 * server-rendered content without application-level browser data reads.
 *
 * The signal is the Firestore web SDK's Listen channel, which carries a
 * `getDoc` too: a read of a reply's reaction document is a request whose body
 * names `reactions/<replyKey>`.
 *
 * The opening post's author is named in the server-rendered document too, so a
 * request body naming `profiles/<authorUid>` is a browser read of that profile.
 * The author's uid is the first profile link on the page.
 *
 * Fixture: the thread seeded with `e2e-reply-1` to `e2e-reply-3` by
 * e2e/reset-fixtures.mjs.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY.
const THREAD_KEY = 'e2e-onboarding-regression-thread';

test('an anonymous reader reads no reaction document for the replies', async ({
  page,
}) => {
  const reads: string[] = [];
  const bodies: string[] = [];
  page.on('request', (request) => {
    if (!request.url().includes('google.firestore.v1.Firestore/')) return;
    let body = request.postData() ?? '';
    try {
      body = decodeURIComponent(body);
    } catch {
      // keep the raw body
    }
    bodies.push(body);
    if (body.includes('reactions/e2e-reply-')) reads.push(request.url());
  });
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`);
  // Allow the session to resolve to anonymous and the replies to mount.
  await page.waitForTimeout(3000);
  expect(reads).toHaveLength(0);

  const href = await page
    .locator('a[href^="/profiles/"]')
    .first()
    .getAttribute('href');
  const memberUid = decodeURIComponent((href ?? '').replace('/profiles/', ''));
  expect(memberUid).not.toBe('');
  expect(
    bodies.filter((body) => body.includes(`profiles/${memberUid}`)),
  ).toHaveLength(0);
});
