import { expect, type Page, test } from '@playwright/test';

/**
 * What only a browser knows about `CnShareAction`: which of the two paths it
 * takes, what it hands the Web Share API, whether `cn-share` bubbles past the
 * control carrying the right outcome, and whether a dismissal is really
 * distinguished from a failure. None of that can be parsed out of the source.
 *
 * The API's presence is the input under test, and it differs between a
 * developer's macOS Chromium and CI's Linux one — so every test below installs
 * its own `navigator.share` before the page loads, or removes it, rather than
 * trusting whatever the running browser has. A real share sheet is a native
 * window Playwright cannot see or close, so the resolutions and rejections are
 * the stub's.
 *
 * Locators read the book page's own `ShareActionSpecimen`: the single
 * unambiguous instance, printing the outcome it heard.
 */

const BOOK = '/base/chrome-actions';

const specimenRoot = (page: Page) =>
  page.locator('#content .share-action-specimen');
const control = (page: Page) => specimenRoot(page).locator('.cn-share-action');
const outcome = (page: Page) => specimenRoot(page).locator('p.text-label');

/** The control is an Astro island: a click before it hydrates changes nothing. */
async function ready(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Install a `navigator.share` that records what it was given and settles the
 * way this test needs. `rejectWith` names the DOMException to throw.
 */
async function withShare(page: Page, rejectWith?: string) {
  await page.addInitScript((name: string | undefined) => {
    const calls: unknown[] = [];
    (window as unknown as { __shareCalls: unknown[] }).__shareCalls = calls;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: unknown) => {
        calls.push(data);
        if (name) throw new DOMException('stubbed', name);
      },
    });
  }, rejectWith);
}

/** Remove the API, so the action must fall back to the clipboard. */
async function withoutShare(page: Page) {
  await page.addInitScript(() => {
    // `delete navigator.share` does not remove an own property on every
    // engine; shadowing it with undefined is what the action's own
    // `if (navigator.share)` guard reads.
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
  });
}

const shareCalls = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __shareCalls?: unknown[] }).__shareCalls ?? [],
  );

test.describe('the browser shares natively', () => {
  test('the page reaches the Web Share API, and cn-share reports shared', async ({
    page,
  }) => {
    await withShare(page);
    await page.goto(BOOK);
    await ready(page);

    await control(page).click();

    await expect(outcome(page)).toHaveText('cn-share outcome: shared');

    const calls = (await shareCalls(page)) as { url: string; title: string }[];
    expect(calls).toHaveLength(1);
    // The specimen states no url or title, so the document supplies both.
    expect(calls[0].url).toBe(page.url());
    expect(calls[0].title).toBe(await page.title());
  });

  test('a dismissed sheet dispatches nothing', async ({ page }) => {
    await withShare(page, 'AbortError');
    await page.goto(BOOK);
    await ready(page);

    await control(page).click();

    // Give any event time to arrive before asserting none did.
    await expect.poll(async () => (await shareCalls(page)).length).toBe(1);
    await expect(outcome(page)).toHaveText('cn-share outcome: —');
  });

  test('any other refusal reports failed', async ({ page }) => {
    await withShare(page, 'NotAllowedError');
    await page.goto(BOOK);
    await ready(page);

    await control(page).click();

    await expect(outcome(page)).toHaveText('cn-share outcome: failed');
  });
});

test.describe('the browser does not share natively', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test("the page's URL lands on the clipboard, and cn-share reports copied", async ({
    page,
  }) => {
    await withoutShare(page);
    await page.goto(BOOK);
    await ready(page);

    await control(page).click();

    await expect(outcome(page)).toHaveText('cn-share outcome: copied');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(page.url());
  });

  test('the control renders the same as it does with the API present', async ({
    page,
  }) => {
    await withoutShare(page);
    await page.goto(BOOK);
    const without = await control(page).boundingBox();

    await withShare(page);
    await page.goto(BOOK);
    const withApi = await control(page).boundingBox();

    expect(without).toEqual(withApi);
  });
});

test.describe('the event reaches above the control', () => {
  test('cn-share bubbles to a listener on window, once per activation', async ({
    page,
  }) => {
    await withShare(page);
    await page.goto(BOOK);
    await ready(page);
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __heard: string[] }).__heard = seen;
      window.addEventListener('cn-share', (event) => {
        seen.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
      });
    });

    await control(page).click();

    await expect(outcome(page)).toHaveText('cn-share outcome: shared');
    const heard = await page.evaluate(
      () => (window as unknown as { __heard: string[] }).__heard,
    );
    expect(heard).toEqual(['shared']);
  });
});
