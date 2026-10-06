import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Scenario "Open a thread" in specs/pelilauta/threads/read-state/spec.md,
 * with the subscription arriving after the session confirms (#176).
 *
 * The subscription listener's Listen request is held back, so the session
 * confirms first and the unread subscription snapshot arrives later.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's THREAD_KEY.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const DELAY_MS = 5000;

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
}

// Writes go to skaldbase-test only; the service account is checked before use.
const serviceAccount = JSON.parse(
  readFileSync(
    new URL('../../../server_principal.json', import.meta.url),
    'utf8',
  ),
);
if (serviceAccount.project_id !== 'skaldbase-test') {
  throw new Error('server_principal.json does not target skaldbase-test.');
}
const app = initializeApp(
  { credential: cert(serviceAccount) },
  'read-marking-awaits-subscription',
);
const subscriptions = getFirestore(app).collection('subscriptions');

let memberUid = '';

test.afterEach(async () => {
  // Leave the member's subscription as the app creates it: nothing seen.
  if (memberUid) await subscriptions.doc(memberUid).delete();
});

test('a thread is marked read when the subscription arrives after the session', async ({
  page,
}) => {
  memberUid = (await getAuth(app).getUserByEmail(existingUser.email)).uid;
  // The thread's flowTime is the fixture reset time, after allSeenAt.
  await subscriptions.doc(memberUid).set({
    uid: memberUid,
    allSeenAt: 1,
    seenEntities: {},
    pushMessages: false,
    notifyOnThreads: false,
    notifyOnLikes: false,
    messagingTokens: [],
  });

  await signIn(page);
  // The persisted copy would stand in for the subscription at load.
  await page.addInitScript(() => localStorage.removeItem('subscription'));

  let held = 0;
  await page.route(
    /google\.firestore\.v1\.Firestore\/Listen/,
    async (route) => {
      let body = route.request().postData() ?? '';
      try {
        body = decodeURIComponent(body);
      } catch {
        // keep the raw body
      }
      if (body.includes(`subscriptions/${memberUid}`)) {
        held++;
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
      await route.continue();
    },
  );

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`);

  await expect
    .poll(
      async () =>
        (await subscriptions.doc(memberUid).get()).data()?.seenEntities?.[
          THREAD_KEY
        ] ?? 0,
      { timeout: 30000 },
    )
    .toBeGreaterThan(0);
  expect(held).toBeGreaterThan(0);
});
