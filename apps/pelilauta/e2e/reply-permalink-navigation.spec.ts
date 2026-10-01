import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/read-state/spec.md:
 *
 *   Scenario: Open reply permalink without JavaScript
 *     Given a URL with a reply-key fragment
 *     When the reader opens the page with JavaScript disabled
 *     Then the browser scrolls to that reply in the initial document
 *     And fixed chrome does not obscure the reply
 *
 * The browser's own fragment navigation does the scrolling; nothing here
 * depends on JavaScript. "Fixed chrome" is the application bar
 * (packages/design-system/components/CnAppBar.astro), fixed to the viewport's
 * block-start inside CnAppChrome.astro — the only fixed chrome present for an
 * anonymous, JavaScript-disabled reader (the docked composer mounts only
 * through `client:only="svelte"`, so it never renders at all here).
 *
 * packages/design-system/styles/preflight.css:182-184 reserves
 * `scroll-margin-block: 5ex` on `:target` so the browser's own fragment
 * navigation clears fixed chrome. This spec measures the actual gap rather
 * than assuming that reservation is sufficient.
 *
 * Fixtures: e2e/reset-fixtures.mjs restores stream/e2e-initial-reply-render-thread
 * and its two replies. Run it, with the dev server already up against
 * skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's REPLY_THREAD_KEY and reply keys. The
// second (later) reply is targeted, so reaching it requires real scrolling.
const THREAD_KEY = 'e2e-initial-reply-render-thread';
const REPLY_KEY = 'e2e-reply-2';

test.use({ javaScriptEnabled: false });

test('Open reply permalink without JavaScript', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}#${REPLY_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(
    scrollY,
    'the document did not scroll at all, so the browser did not navigate to the fragment',
  ).toBeGreaterThan(0);

  const replyBox = await page.locator(`#${REPLY_KEY}`).boundingBox();
  const chromeBox = await page.locator('header.cn-app-bar').boundingBox();
  expect(replyBox, 'the target reply has no layout box').not.toBeNull();
  expect(chromeBox, 'the fixed app bar has no layout box').not.toBeNull();

  const reply = replyBox as {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  const chrome = chromeBox as {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  const chromeBottom = chrome.y + chrome.height;

  expect(
    reply.y,
    `fixed chrome occupies the viewport down to y=${chromeBottom}px, but the target reply's top edge is at y=${reply.y}px — the app bar obscures it`,
  ).toBeGreaterThanOrEqual(chromeBottom);
});
