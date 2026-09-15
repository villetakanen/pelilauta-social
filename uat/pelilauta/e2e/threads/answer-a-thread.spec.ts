/**
 * Journey: A signed-in reader answers a thread from the chat bar, and a reader
 * who is not signed in is invited to join the discussion instead.
 *
 * `specs/pelilauta/threads/reply-authoring/spec.md` states both.
 */
import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage, openVisitorPage } from '../harness';

const THREAD_KEY = 'kauhupelit-syysiltoina';

let readerBrowser: Browser;
let readerPage: Page;
let visitorBrowser: Browser;
let visitorPage: Page;

beforeAll(async () => {
  ({ browser: readerBrowser, page: readerPage } =
    await openReaderPage('existingUser'));
  ({ browser: visitorBrowser, page: visitorPage } = await openVisitorPage());
});

afterAll(async () => {
  await readerBrowser?.close();
  await visitorBrowser?.close();
});

it('gives a signed-in reader the chat bar, and a visitor the invitation to join', async () => {
  // 1. The signed-in reader opens the thread.
  await readerPage.goto(`/threads/${THREAD_KEY}`);

  // The bar stands, so there is somewhere to type. Watch for the invitation
  // on every tick while waiting, so a flash during rehydration is caught,
  // not just its state once the bar settles.
  const bar = readerPage.locator('.cn-chat-bar');
  const invitation = readerPage.getByRole('link', {
    name: /osallistu keskusteluun/i,
  });
  let invitationSeen = false;
  await expect
    .poll(
      async () => {
        if ((await invitation.count()) > 0) invitationSeen = true;
        return bar.isVisible();
      },
      { timeout: 30_000 },
    )
    .toBe(true);

  // The invitation never showed, not even for a moment.
  expect(invitationSeen).toBe(false);

  // 2. A reader who is not signed in opens the same thread.
  await visitorPage.goto(`/threads/${THREAD_KEY}`);

  // One invitation stands, and it leads to the login page.
  const visitorInvitation = visitorPage.getByRole('link', {
    name: /osallistu keskusteluun/i,
  });
  await expect
    .poll(() => visitorInvitation.count(), { timeout: 30_000 })
    .toBe(1);
  await expect
    .poll(() => visitorInvitation.getAttribute('href'), { timeout: 15_000 })
    .toBe('/login');

  // No bar stands for them.
  await expect
    .poll(() => visitorPage.locator('.cn-chat-bar').count(), {
      timeout: 15_000,
    })
    .toBe(0);
});
