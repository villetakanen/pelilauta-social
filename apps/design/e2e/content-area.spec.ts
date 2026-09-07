import { expect, test } from '@playwright/test';

const BOOK = '/utilities/content-area';

test('authored lists retain native markers and gain a gutter while scaffold lists stay bare', async ({
  page,
}) => {
  await page.setViewportSize({ width: 400, height: 900 });
  await page.goto(BOOK);
  const lists = page
    .locator('figure')
    .filter({
      hasText: 'Unordered and ordered lists retain markers and nesting',
    })
    .locator('.themed');
  for (const panel of await lists.all()) {
    const area = panel.locator('.content-area');
    const authored = area.locator('ul').first();
    const nested = authored.locator('ul').first();
    const ordered = authored.locator('xpath=following-sibling::ol[1]');
    const scaffold = area.locator('ul[role="list"]');
    const gutter = await authored.evaluate((node) => {
      const style = getComputedStyle(node);
      return Number.parseFloat(style.fontSize) * 1.5;
    });
    await expect(authored).toHaveCSS('list-style-type', 'disc');
    await expect(authored).toHaveCSS('padding-left', `${gutter}px`);
    await expect(nested).toHaveCSS('list-style-type', 'circle');
    await expect(ordered).toHaveCSS('list-style-type', 'decimal');
    await expect(scaffold).toHaveCSS('list-style-type', 'none');
    await expect(scaffold).toHaveCSS('padding-left', '0px');
  }
});

test('the content floor has zero specificity and teasers read as compact summaries', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BOOK);
  const rhythm = page
    .locator('figure')
    .filter({ hasText: 'Authored blocks follow the content area' })
    .locator('.content-area');
  const paragraph = rhythm
    .filter({ hasText: 'A paragraph introduces' })
    .locator('> p')
    .first();
  const finalParagraph = rhythm.locator('> p').last();
  const teaserFigure = page
    .locator('figure')
    .filter({ hasText: 'A teaser reads as a compact summary' });
  const teaserParagraph = teaserFigure.locator('.teaser p').first();
  const teaserList = teaserFigure.locator('.teaser ol').first();
  const cardDescription = page
    .locator('figure')
    .filter({ hasText: 'A component keeps its declared spacing' })
    .locator('.content-area p')
    .first();
  const media = page
    .locator('figure')
    .filter({ hasText: 'A table and media stay inside the offered region' })
    .getByRole('img', { name: 'A media example' })
    .first();

  const resolveVar = (token: string) =>
    page.evaluate((value) => {
      const probe = document.createElement('div');
      probe.style.marginBlockEnd = value;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).marginBlockEnd;
      probe.remove();
      return resolved;
    }, `var(${token})`);

  const line = await resolveVar('--cn-line');
  const grid = await resolveVar('--cn-grid');
  const small = await resolveVar('--cn-font-size-small');
  expect(line).toMatch(/px$/);
  await expect(paragraph).toHaveCSS('margin-bottom', line);
  await expect(finalParagraph).toHaveCSS('margin-bottom', '0px');
  await expect(cardDescription).toHaveCSS('margin-bottom', '0px');

  // The teaser reads small, its non-final block carries a compact gap, its final
  // block sits flush, and an authored list keeps its markers inside the gutter.
  await expect(teaserParagraph).toHaveCSS('font-size', small);
  await expect(teaserParagraph).toHaveCSS('margin-bottom', grid);
  await expect(teaserList).toHaveCSS('margin-bottom', '0px');
  await expect(teaserList).toHaveCSS('list-style-type', 'decimal');
  const teaserGutter = await teaserList.evaluate(
    (node) => Number.parseFloat(getComputedStyle(node).fontSize) * 1.5,
  );
  await expect(teaserList).toHaveCSS('padding-left', `${teaserGutter}px`);
  const mediaBox = await media.boundingBox();
  const areaBox = await media
    .locator('xpath=ancestor::div[contains(@class,"content-area")]')
    .boundingBox();
  expect(mediaBox).toBeTruthy();
  expect(areaBox).toBeTruthy();
  expect(mediaBox?.width).toBeLessThanOrEqual(areaBox?.width ?? 0);
  expect(mediaBox?.height).toBeCloseTo((mediaBox?.width ?? 0) * 0.4, 0);
});
