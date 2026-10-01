import { expect, test } from '@playwright/test';
// Credentials live at the repository root, gitignored, never in the app. See
// e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Compose the thread page
 *     Given a thread with replies and an active signed-in reader
 *     When the page renders
 *     Then the opening post precedes the discussion in document order
 *     And page content mounts in the shared main frame through content containers
 *     And the composer mounts in the chrome authoring slot
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-initial-reply-render-thread
 * and its replies, and the signed-in member's account and profile. Run it,
 * with the dev server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's REPLY_THREAD_KEY.
const THREAD_KEY = 'e2e-initial-reply-render-thread';

test('Compose the thread page', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  // Sign in through the real login form, as onboarding-callout-transition.spec.ts does.
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  // The opening post precedes the discussion in document order.
  const openingPost = page.locator('article').first();
  const discussion = page.locator('#discussion');
  await expect(openingPost).toBeAttached();
  await expect(discussion).toBeAttached();
  const openingPrecedesDiscussion = await page.evaluate(() => {
    const article = document.querySelector('article');
    const discussionEl = document.getElementById('discussion');
    if (!article || !discussionEl) return false;
    return Boolean(
      article.compareDocumentPosition(discussionEl) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  expect(
    openingPrecedesDiscussion,
    'the opening post does not precede #discussion in document order',
  ).toBe(true);

  // Page content mounts in the shared main frame (Base.astro's
  // `<main class="app-main">`) through content containers: `.content-golden`
  // (the opening post and thread info) and `.content-prose` (the discussion).
  const mainFrame = page.locator('main.app-main');
  await expect(mainFrame.locator('.content-golden article')).toContainText(
    'E2E initial reply render regression thread',
  );
  await expect(mainFrame.locator('#discussion.content-prose')).toBeAttached();

  // The composer mounts in the chrome authoring slot: Base.astro places
  // `<slot name="authoring" />` inside `CnAppChrome`, not inside `<main>`.
  const chromeComposer = page.locator('.app-chrome .cn-chat-bar');
  await expect(chromeComposer).toBeAttached();
  await expect(page.locator('main.app-main .cn-chat-bar')).toHaveCount(0);
});
