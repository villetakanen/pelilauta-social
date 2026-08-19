/**
 * Journey: A reader discovers a thread on the front page and reacts with love.
 * Another authenticated reader sees the updated reaction count and adds their own.
 */
import type { Browser, Page } from 'playwright';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openReaderPage } from '../harness';

let browserA: Browser;
let pageA: Page;
let browserB: Browser;
let pageB: Page;

beforeAll(async () => {
  ({ browser: browserA, page: pageA } = await openReaderPage('existingUser'));
  ({ browser: browserB, page: pageB } = await openReaderPage('adminUser'));
});

afterAll(async () => {
  await browserA?.close();
  await browserB?.close();
});

it('reacts to a thread on the front page and propagates the reaction to another reader', async () => {
  const threadKey = 'kauhupelit-syysiltoina';
  const threadTitle = 'Kauhupelien tunnelman luominen syysiltoina';

  // 1. Actor A visits the front page and finds the seeded thread card.
  await pageA.goto('/');
  const cardA = pageA.locator(`#thread-card-${threadKey}`);
  await expect.poll(() => cardA.isVisible(), { timeout: 30_000 }).toBe(true);

  // The card presents the title and cover image.
  const titleLinkA = cardA.getByRole('link', { name: threadTitle });
  await expect
    .poll(() => titleLinkA.isVisible(), { timeout: 15_000 })
    .toBe(true);

  // The reaction button on the card is initially unpressed with 0 reactions.
  const reactionButtonA = cardA.getByRole('button', { name: /tykkää/i });
  await expect
    .poll(() => reactionButtonA.isVisible(), { timeout: 15_000 })
    .toBe(true);
  await expect
    .poll(() => reactionButtonA.getAttribute('aria-pressed'), {
      timeout: 15_000,
    })
    .toBe('false');

  // 2. Actor A clicks the reaction button to love the thread.
  await reactionButtonA.click();

  // The reaction button updates to pressed state with count 1.
  await expect
    .poll(() => reactionButtonA.getAttribute('aria-pressed'), {
      timeout: 15_000,
    })
    .toBe('true');
  await expect
    .poll(async () => reactionButtonA.textContent(), { timeout: 15_000 })
    .toContain('1');

  // 3. Actor B visits the front page and sees the updated reaction count.
  await pageB.goto('/');
  const cardB = pageB.locator(`#thread-card-${threadKey}`);
  await expect.poll(() => cardB.isVisible(), { timeout: 30_000 }).toBe(true);

  const reactionButtonB = cardB.getByRole('button', { name: /tykkää/i });
  await expect
    .poll(() => reactionButtonB.isVisible(), { timeout: 15_000 })
    .toBe(true);

  // Actor B sees count 1, but unpressed for Actor B.
  await expect
    .poll(() => reactionButtonB.getAttribute('aria-pressed'), {
      timeout: 15_000,
    })
    .toBe('false');
  await expect
    .poll(async () => reactionButtonB.textContent(), { timeout: 15_000 })
    .toContain('1');

  // 4. Actor B also reacts to the thread.
  await reactionButtonB.click();
  await expect
    .poll(() => reactionButtonB.getAttribute('aria-pressed'), {
      timeout: 15_000,
    })
    .toBe('true');
  await expect
    .poll(async () => reactionButtonB.textContent(), { timeout: 15_000 })
    .toContain('2');

  // 5. Actor A navigates to the thread detail view and verifies total count is 2.
  await pageA.goto(`/threads/${threadKey}`);
  const threadDetailReaction = pageA
    .getByRole('button', { name: /tykkää/i })
    .first();

  await expect
    .poll(() => threadDetailReaction.isVisible(), { timeout: 15_000 })
    .toBe(true);
  await expect
    .poll(() => threadDetailReaction.getAttribute('aria-pressed'), {
      timeout: 15_000,
    })
    .toBe('true');
  await expect
    .poll(async () => threadDetailReaction.textContent(), { timeout: 15_000 })
    .toContain('2');
});
