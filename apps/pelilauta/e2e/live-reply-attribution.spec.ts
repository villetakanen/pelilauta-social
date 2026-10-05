import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * A live reply inserted between two others shifts the replies after it. Each
 * reply keeps its own author's name, profile link and date (#175).
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Match e2e/reset-fixtures.mjs's THREAD_KEY, replyBase and second author.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const REPLY_BASE = Date.UTC(2026, 0, 1);
const SECOND_AUTHOR_UID = 'e2e-second-author';
const SECOND_AUTHOR_NICK = 'E2E Second Author';
const MEMBER_NICK = 'E2E Regression Member';
const INSERTED_KEY = 'e2e-live-inserted-reply';

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
  'live-reply-attribution',
);
const replies = getFirestore(app)
  .collection('stream')
  .doc(THREAD_KEY)
  .collection('comments');

test.afterEach(async () => {
  await replies.doc(INSERTED_KEY).delete();
});

test('a live reply inserted between replies leaves each under its own author', async ({
  page,
}) => {
  const member = await getAuth(app).getUserByEmail(existingUser.email);
  await signIn(page);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}#discussion`);
  await expect(page.locator('[id="e2e-reply-3"]')).toBeVisible();

  const insertedAt = Timestamp.fromMillis(REPLY_BASE + 500);
  await replies.doc(INSERTED_KEY).set({
    markdownContent: 'Live reply from the second author.',
    owners: [SECOND_AUTHOR_UID],
    createdAt: insertedAt,
    updatedAt: insertedAt,
    flowTime: insertedAt,
  });

  const expected = [
    ['e2e-reply-1', member.uid, MEMBER_NICK],
    [INSERTED_KEY, SECOND_AUTHOR_UID, SECOND_AUTHOR_NICK],
    ['e2e-reply-2', member.uid, MEMBER_NICK],
    ['e2e-reply-3', member.uid, MEMBER_NICK],
  ];
  await expect(page.locator('.replies > div')).toHaveCount(expected.length);
  for (const [key, uid, nick] of expected) {
    const link = page.locator(`[id="${key}"] .cn-nick`);
    await expect(link).toHaveText(nick);
    await expect(link).toHaveAttribute('href', `/profiles/${uid}`);
  }
});
