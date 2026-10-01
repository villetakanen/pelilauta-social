import { expect, test } from '@playwright/test';

/**
 * Regression for specs/pelilauta/threads/spec.md:
 *
 *   Scenario: Inspect discovery metadata
 *     Given a public thread with attributed replies and known dates
 *     When the initial HTML renders
 *     Then valid DiscussionForumPosting data identifies the opening post
 *     And Comment entries match rendered replies and destinations
 *     And user text remains data when containing HTML or script delimiters
 *
 * Fixtures: e2e/reset-fixtures.mjs restores
 * stream/e2e-discovery-metadata-thread and its two replies, both authored by
 * the member whose profiles document the same script restores; the second
 * reply's body carries `</script>`, angle brackets and an ampersand. Run it,
 * with the dev server already up against skaldbase-test, before this spec.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
// Matches e2e/reset-fixtures.mjs's DISCOVERY_* ids and bodies.
const THREAD_KEY = 'e2e-discovery-metadata-thread';
const THREAD_TITLE = 'E2E discovery metadata regression thread';
const REPLY_KEY = 'e2e-discovery-reply-1';
const HOSTILE_REPLY_KEY = 'e2e-discovery-hostile-reply';
const REPLY_BODY = 'The first discovery-metadata reply body.';
const HOSTILE_BODY =
  'Hostile reply text: </script><img src=x onerror=alert(1)> with <b>angle</b> brackets & an ampersand.';
// Matches profiles/<memberUid>.nick, restored by the same reset script.
const AUTHOR_NICK = 'E2E Regression Member';

test.use({ javaScriptEnabled: false });

test('Inspect discovery metadata', async ({ page }) => {
  // Refuse to proceed against anything but the test environment, the same
  // guard the reset script applies before mutating.
  const configResponse = await page.request.get(
    `${BASE_URL}/api/test/firebase-config`,
  );
  expect(configResponse.ok()).toBeTruthy();
  const liveConfig = await configResponse.json();
  expect(liveConfig.projectId).toBe('skaldbase-test');

  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });

  const block = page.locator('script[type="application/ld+json"]');
  await expect(block).toHaveCount(1);

  const graph = JSON.parse((await block.textContent()) ?? '');

  expect(graph['@context']).toBe('https://schema.org');
  expect(graph['@type']).toBe('DiscussionForumPosting');
  expect(graph.headline).toBe(THREAD_TITLE);
  expect(graph.url).toBe(`${BASE_URL}/threads/${THREAD_KEY}`);
  expect(graph.author.name).toBe(AUTHOR_NICK);
  expect(typeof graph.datePublished).toBe('string');

  // Comment entries match the rendered replies and their destinations.
  const comments = graph.comment as Array<Record<string, string>>;
  expect(comments).toHaveLength(2);
  const byUrl = Object.fromEntries(
    comments.map((comment) => [comment.url, comment]),
  );
  const replyUrl = `${BASE_URL}/threads/${THREAD_KEY}#${REPLY_KEY}`;
  const hostileUrl = `${BASE_URL}/threads/${THREAD_KEY}#${HOSTILE_REPLY_KEY}`;
  expect(byUrl[replyUrl].text).toBe(REPLY_BODY);
  expect(byUrl[hostileUrl].text).toBe(HOSTILE_BODY);
  for (const comment of comments) {
    expect(comment['@type']).toBe('Comment');
    expect((comment.author as unknown as { name: string }).name).toBe(
      AUTHOR_NICK,
    );
    expect(typeof comment.datePublished).toBe('string');
  }

  // Each destination the metadata names is a reply the document renders.
  await expect(page.locator(`#${REPLY_KEY}`)).toBeAttached();
  await expect(page.locator(`#${HOSTILE_REPLY_KEY}`)).toBeAttached();

  // User text remains data: the block parsed above, so the reply's `</script>`
  // never closed it, and no delimiter survives into the document as markup.
  const blockText = (await block.textContent()) ?? '';
  expect(blockText).not.toContain('<');
  expect(blockText).not.toContain('>');
  expect(blockText).not.toContain('&');
  expect(blockText).toContain('\\u003c');
});
