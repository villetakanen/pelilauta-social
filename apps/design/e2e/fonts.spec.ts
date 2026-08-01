import { expect, test } from '@playwright/test';

/**
 * Font delivery in a browser. The stylesheet tests in packages/design-system can
 * see what is declared; only a browser can see whether a declared face actually
 * fetches and parses, and which family an element ends up in. Both failures are
 * silent: a weight with no face is synthesised, and a family that never loads
 * renders correctly for anyone who has it installed — which includes whoever is
 * looking at the screen.
 *
 * `document.fonts.check()` is not used. It answers whether the given text can be
 * rendered, which an installed copy of the family satisfies, so it passes with
 * every face blocked. The FontFaceSet's own entries are the CSS-declared faces, and
 * loading each one is what proves the file behind it exists.
 *
 * Spec: specs/design-system/fonts/spec.md
 */

const BOOK = '/base/fonts';

/** Every face the page declares, loaded, with whatever failed named. */
const loadEveryFace = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const faces = [...document.fonts];
    const failed: string[] = [];
    await Promise.all(
      faces.map(async (face) => {
        try {
          await face.load();
        } catch {
          failed.push(`${face.family} ${face.weight} ${face.style}`);
        }
      }),
    );
    return {
      failed,
      declared: faces.map(
        (face) => `${face.family} ${face.weight} ${face.style}`,
      ),
    };
  });

test('every declared face fetches and parses', async ({ page }) => {
  await page.goto(BOOK);
  const { failed, declared } = await loadEveryFace(page);

  expect(failed).toEqual([]);
  // Seven weights and their italics in the human register, two ranges each; one
  // weight and no italic in the technical one.
  expect(declared.filter((face) => face.startsWith('Lato'))).toHaveLength(28);
  expect(
    declared.filter((face) => face.startsWith('Roboto Mono')),
  ).toHaveLength(2);
});

test('every weight the scale names has an upright and an italic', async ({
  page,
}) => {
  await page.goto(BOOK);
  const { declared } = await loadEveryFace(page);
  for (const weight of [200, 300, 400, 500, 700]) {
    expect(declared, `Lato ${weight} upright`).toContain(
      `Lato ${weight} normal`,
    );
    expect(declared, `Lato ${weight} italic`).toContain(
      `Lato ${weight} italic`,
    );
  }
});

test('the two ranges are two faces, not one omnibus file', async ({ page }) => {
  await page.goto(BOOK);
  const ranges = await page.evaluate(() =>
    [...document.fonts]
      .filter((face) => face.family === 'Lato' && face.weight === '400')
      .map((face) => face.style + ' ' + face.unicodeRange),
  );
  // Upright and italic, each split in two: a reader fetches latin-ext only when a
  // character needs it.
  expect(ranges).toHaveLength(4);
  expect(new Set(ranges).size).toBe(4);
});

test('the document is in the human register and code is in the technical one', async ({
  page,
}) => {
  await page.goto(BOOK);
  const family = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => getComputedStyle(element).fontFamily);

  expect(await family('body')).toMatch(/^Lato/);
  expect(await family('main code')).toMatch(/^["']?Roboto Mono/);
});

test('with every face blocked, neither register falls to a serif', async ({
  page,
}) => {
  await page.route('**/*.woff2', (route) => route.abort());
  await page.goto(BOOK);

  const { failed } = await loadEveryFace(page);
  expect(failed.length, 'the route block did not take effect').toBeGreaterThan(
    0,
  );

  const stacks = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      human: root.getPropertyValue('--cn-font-family'),
      technical: root.getPropertyValue('--cn-font-family-mono'),
    };
  });
  expect(stacks.human.trim()).toMatch(/sans-serif$/);
  expect(stacks.technical.trim()).toMatch(/monospace$/);

  // Text is visible while the faces are missing, because every face swaps.
  await expect(page.locator('main h1')).toBeVisible();
  const height = await page
    .locator('main h1')
    .evaluate((element) => element.getBoundingClientRect().height);
  expect(height).toBeGreaterThan(0);
});
