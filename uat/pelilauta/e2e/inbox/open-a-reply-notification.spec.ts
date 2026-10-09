/**
 * Journey: A member posts a thread, another member replies, and the author
 * opens the reply notification in the inbox and lands on the reply in the
 * thread.
 *
 * `specs/pelilauta/inbox/spec.md` and `specs/pelilauta/notifications/spec.md`
 * state the notification and where it leads. The application writes the
 * notification after the reply lands, so the journey waits for it to appear.
 */
import type { Browser, Page } from 'playwright';
import { t } from 'src/utils/i18n';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

let authorBrowser: Browser;
let authorPage: Page;
let replierBrowser: Browser;
let replierPage: Page;

beforeAll(async () => {
  ({ browser: authorBrowser, page: authorPage } =
    await openReaderPage('existingUser'));
  ({ browser: replierBrowser, page: replierPage } =
    await openReaderPage('adminUser'));
});

afterAll(async () => {
  await authorBrowser?.close();
  await replierBrowser?.close();
});

it('leads from the inbox notification of a reply to the reply in the thread', async () => {
  const stamp = Date.now();
  const title = `Uat inbox thread ${stamp}`;
  // The notification titles itself with the first 50 characters of the reply.
  const replyText = `Uat inbox reply ${stamp}`;

  // 1. The author posts a thread.
  await authorPage.goto('/create/thread');
  const titleField = authorPage.locator(
    'form#thread-editor input[name="title"]',
  );
  await titleField.waitFor({ state: 'visible', timeout: 60_000 });
  await titleField.fill(title);
  const canvas = authorPage.locator('.cn-editor .cm-content');
  await canvas.waitFor({ state: 'visible', timeout: 60_000 });
  await canvas.click();
  await authorPage.keyboard.type(`Uat inbox thread body ${stamp}`);
  const send = authorPage.getByTestId('send-thread-button');
  await expect.poll(() => send.isDisabled(), { timeout: 15_000 }).toBe(false);

  // Saving lands on the thread.
  await send.click();
  await authorPage.waitForURL(/\/threads\/[^/#?]+$/, { timeout: 60_000 });
  const threadPath = new URL(authorPage.url()).pathname;

  // 2. Another member replies from the chat bar.
  await replierPage.goto(threadPath);
  const replyField = replierPage.locator('.cn-chat-bar textarea');
  await replyField.waitFor({ state: 'visible', timeout: 60_000 });
  await replyField.fill(replyText);
  const sendReply = replierPage
    .locator('.cn-chat-bar')
    .getByRole('button', { name: t('actions:send') });
  const standing = replierPage.getByText(replyText).first();

  // The reply stands in the thread.
  await sendReply.click();
  await expect.poll(() => standing.isVisible(), { timeout: 60_000 }).toBe(true);

  // 3. The notification arrives after the reply, so the author reloads the
  // inbox until it lists the reply.
  const notification = authorPage.getByRole('link', { name: replyText });
  await expect
    .poll(
      async () => {
        await authorPage.goto('/inbox');
        return notification
          .waitFor({ state: 'visible', timeout: 5_000 })
          .then(() => true)
          .catch(() => false);
      },
      { timeout: 60_000, interval: 1_000 },
    )
    .toBe(true);

  // 4. Following the notification lands on the reply in the thread.
  await notification.click();
  await authorPage.waitForURL(/\/threads\/[^/#?]+#.+/, { timeout: 30_000 });
  const landed = new URL(authorPage.url());
  expect(landed.pathname).toBe(threadPath);
  const replyKey = decodeURIComponent(landed.hash.slice(1));
  expect(replyKey).not.toBe('discussion');

  const reply = authorPage.locator(`[id="${replyKey}"]`);
  await expect.poll(() => reply.isVisible(), { timeout: 30_000 }).toBe(true);
  await expect
    .poll(() => reply.getByText(replyText).isVisible(), { timeout: 15_000 })
    .toBe(true);
});
