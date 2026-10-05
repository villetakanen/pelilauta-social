/**
 * Journey: a signed-out visitor navigates from the seeded D&D tag listing to
 * the beginner thread and Gloamroad wiki page.
 *
 * `docs/acceptance-testing-seed.md` defines seeded tag content and
 * `apps/pelilauta/src/pages/tags/[tag].astro` defines route behavior.
 */
import type { Browser, Page } from 'playwright';
import { t } from 'src/utils/i18n';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { openVisitorPage } from '../harness';

/**
 * `TagSynonyms.ts` registers `d%26d` as the canonical D&D tag.
 * The journey requests the canonical path directly to assert listing content
 * rather than HTTP redirects.
 */
const TAG_URL = '/tags/d%26d';

const THREAD_KEY = 'ensikertalaisen-pelinjohtaminen';
const THREAD_TITLE = 'Vinkkejä ensimmäiseen pelinjohtajakertaan';
const PAGE_URL = '/sites/gloamroad-company/front-page';
const PAGE_TITLE = 'Front Page';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  ({ browser, page } = await openVisitorPage());
});

afterAll(async () => {
  await browser?.close();
});

it('leads a signed-out visitor from the D&D tag to the seeded thread and wiki page', async () => {
  // 1. The visitor opens the D&D tag listing.
  await page.goto(TAG_URL);

  const heading = page.locator('.tag-title-row h1');
  await expect
    .poll(() => heading.textContent(), { timeout: 30_000 })
    .toBe('#D&D');

  // 2. The listing names the beginner thread under discussions...
  const discussionsHeading = page.getByRole('heading', {
    name: new RegExp(t('tag:discussions')),
  });
  await expect
    .poll(() => discussionsHeading.isVisible(), { timeout: 15_000 })
    .toBe(true);

  const threadLink = page.getByRole('link', { name: THREAD_TITLE });
  await expect
    .poll(() => threadLink.isVisible(), { timeout: 15_000 })
    .toBe(true);
  await expect
    .poll(() => threadLink.getAttribute('href'), { timeout: 15_000 })
    .toBe(`/threads/${THREAD_KEY}`);

  // ...and the Gloamroad front page under pages.
  const pagesHeading = page.getByRole('heading', {
    name: new RegExp(t('tag:pages')),
  });
  await expect
    .poll(() => pagesHeading.isVisible(), { timeout: 15_000 })
    .toBe(true);

  const pageLink = page.getByRole('link', { name: PAGE_TITLE });
  await expect.poll(() => pageLink.isVisible(), { timeout: 15_000 }).toBe(true);
  await expect
    .poll(() => pageLink.getAttribute('href'), { timeout: 15_000 })
    .toBe(PAGE_URL);

  // 3. The visitor opens the thread and reads its seeded replies.
  await threadLink.click();
  await page.waitForURL(`**/threads/${THREAD_KEY}`, { timeout: 30_000 });

  const threadHeading = page.locator('h1.text-h2');
  await expect
    .poll(() => threadHeading.textContent(), { timeout: 30_000 })
    .toBe(THREAD_TITLE);

  const discussion = page.getByRole('region', {
    name: t('threads:discussion.title'),
  });
  const firstReply = discussion.getByText('älä suunnittele liikaa etukäteen');
  await expect
    .poll(() => firstReply.isVisible(), { timeout: 30_000 })
    .toBe(true);

  const secondReply = discussion.getByText('en tapahtumaketjuja');
  await expect
    .poll(() => secondReply.isVisible(), { timeout: 15_000 })
    .toBe(true);

  // 4. Back on the listing, the visitor opens the wiki page and reads it.
  await page.goto(TAG_URL);
  const wikiLink = page.getByRole('link', { name: PAGE_TITLE });
  await expect.poll(() => wikiLink.isVisible(), { timeout: 30_000 }).toBe(true);
  await wikiLink.click();
  await page.waitForURL('**/sites/gloamroad-company/front-page', {
    timeout: 30_000,
  });

  const pageArticle = page.locator('article.page-article');
  await expect
    .poll(() => pageArticle.isVisible(), { timeout: 30_000 })
    .toBe(true);

  const wikiHeading = pageArticle.locator('.content-area h1').first();
  await expect
    .poll(() => wikiHeading.textContent(), { timeout: 15_000 })
    .toBe('The Gloamroad Company');

  const wikiBody = pageArticle.getByText('Dunbarrow');
  await expect
    .poll(() => wikiBody.count(), { timeout: 15_000 })
    .toBeGreaterThan(0);
});
