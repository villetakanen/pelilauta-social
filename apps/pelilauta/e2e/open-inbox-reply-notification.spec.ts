import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * specs/pelilauta/inbox/spec.md governs notification destinations and acknowledgment.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Match e2e/reset-fixtures.mjs's THREAD_KEY, REPLIES and the notification's targetTitle.
const THREAD_KEY = 'e2e-onboarding-regression-thread';
const REPLY_KEY = 'e2e-reply-3';
const NOTIFICATION_TITLE = 'E2E inbox reply notification';

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
}

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
  'inbox-acknowledgment',
);
const notification = getFirestore(app)
  .collection('notifications')
  .doc('e2e-inbox-reply-notification');

test.beforeEach(async () => {
  await notification.update({ read: false });
});

test.afterEach(async () => {
  await notification.update({ read: false });
});

test('following a reply notification persists acknowledgment and updates the unread count', async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`${BASE_URL}/inbox`);

  const row = page
    .locator('article.notification-item')
    .filter({ hasText: NOTIFICATION_TITLE });
  await expect(row).toHaveClass(/elevation-3/);
  expect((await notification.get()).data()?.read).toBe(false);
  const count = page.locator('.content-prose p.text-right');
  const unreadBefore = Number.parseInt(await count.innerText(), 10);
  await page.getByRole('link', { name: NOTIFICATION_TITLE }).click();

  await expect(page).toHaveURL(
    `${BASE_URL}/threads/${THREAD_KEY}#${REPLY_KEY}`,
  );
  await expect(page.locator(`[id="${REPLY_KEY}"]`)).toBeInViewport();
  await expect
    .poll(async () => (await notification.get()).data()?.read)
    .toBe(true);
  await page.goto(`${BASE_URL}/inbox`);
  await expect(row).toBeVisible();
  await expect(row).not.toHaveClass(/elevation-3/);
  await expect
    .poll(async () => Number.parseInt(await count.innerText(), 10))
    .toBe(unreadBefore - 1);
});

test('opening the content independently leaves the notification unread', async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}#${REPLY_KEY}`);
  await expect(page.locator(`[id="${REPLY_KEY}"]`)).toBeVisible();
  await page.goto(`${BASE_URL}/inbox`);
  await expect(
    page
      .locator('article.notification-item')
      .filter({ hasText: NOTIFICATION_TITLE }),
  ).toHaveClass(/elevation-3/);
  expect((await notification.get()).data()?.read).toBe(false);
});

test('failed acknowledgment leaves the notification unread and allows navigation', async ({
  page,
}) => {
  await page.route('**/src/library/client/inbox/markRead.ts*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'export async function markRead() { throw new Error("Controlled acknowledgment failure"); }',
    }),
  );
  const failure = page.waitForEvent('console', (message) =>
    message.text().includes('Notification acknowledgment failed'),
  );
  await signIn(page);
  await page.goto(`${BASE_URL}/inbox`);
  await page.getByRole('link', { name: NOTIFICATION_TITLE }).click();
  await failure;
  await expect(page).toHaveURL(
    `${BASE_URL}/threads/${THREAD_KEY}#${REPLY_KEY}`,
  );
  await page.goto(`${BASE_URL}/inbox`);
  await expect(
    page
      .locator('article.notification-item')
      .filter({ hasText: NOTIFICATION_TITLE }),
  ).toHaveClass(/elevation-3/);
  expect((await notification.get()).data()?.read).toBe(false);
});
