import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Scenario "Terminate a live subscription" in
 * specs/pelilauta/threads/replies/spec.md.
 *
 * The signal is the Firestore web SDK's Listen channel: each target it
 * registers is sent as a request to `.../google.firestore.v1.Firestore/Listen/
 * channel` whose body names the queried collection path. A reply listener is
 * a Listen request whose body names `stream/<thread>/comments`. Other
 * listeners (inbox, subscriptions) share the channel but name other paths.
 *
 * Fixture: the thread seeded by e2e/reset-fixtures.mjs; the subscription
 * opens whether or not the thread has replies.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const REPLY_QUERY_PATH = `stream/${THREAD_KEY}`;

/** Count of Listen requests that register the thread's reply query. */
function trackReplyListens(page: Page) {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (!request.url().includes('google.firestore.v1.Firestore/Listen')) return;
    let body = request.postData() ?? '';
    try {
      body = decodeURIComponent(body);
    } catch {
      // keep the raw body
    }
    if (body.includes(REPLY_QUERY_PATH) && body.includes('comments')) {
      seen.push(request.url());
    }
  });
  return seen;
}

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
}

test('an anonymous reader opens no reply subscription', async ({ page }) => {
  const listens = trackReplyListens(page);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`);
  // Allow the session to resolve to anonymous before judging.
  await page.waitForTimeout(3000);
  expect(listens).toHaveLength(0);
});

test('a reply subscription terminates on sign-out', async ({ page }) => {
  await signIn(page);

  const listens = trackReplyListens(page);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`);
  await expect.poll(() => listens.length).toBeGreaterThan(0);

  // Sign out in place, through the application's own session store, so the
  // page stays and only the session changes. The settings-page button
  // navigates away, which would test page departure instead.
  await page.evaluate(async () => {
    const { logout } = await import('/src/stores/session/index.ts');
    await logout();
  });

  // Nothing registers the reply query again after sign-out, and the page is
  // still the thread.
  const before = listens.length;
  await page.waitForTimeout(3000);
  expect(page.url()).toBe(`${BASE_URL}/threads/${THREAD_KEY}`);
  expect(listens.length).toBe(before);
});
