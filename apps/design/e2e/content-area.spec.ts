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

test('the content floor has zero specificity and teasers remain flat', async ({
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
  const teaser = page
    .locator('figure')
    .filter({ hasText: 'A teaser keeps its component layout' })
    .locator('.teaser p')
    .first();
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

  const line = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.marginBlockEnd = 'var(--cn-line)';
    document.body.append(probe);
    const resolved = getComputedStyle(probe).marginBlockEnd;
    probe.remove();
    return resolved;
  });
  expect(line).toMatch(/px$/);
  await expect(paragraph).toHaveCSS('margin-bottom', line);
  await expect(finalParagraph).toHaveCSS('margin-bottom', '0px');
  await expect(cardDescription).toHaveCSS('margin-bottom', '0px');
  await expect(teaser).toHaveCSS('margin-bottom', '0px');
  const mediaBox = await media.boundingBox();
  const areaBox = await media
    .locator('xpath=ancestor::div[contains(@class,"content-area")]')
    .boundingBox();
  expect(mediaBox).toBeTruthy();
  expect(areaBox).toBeTruthy();
  expect(mediaBox?.width).toBeLessThanOrEqual(areaBox?.width ?? 0);
  expect(mediaBox?.height).toBeCloseTo((mediaBox?.width ?? 0) * 0.4, 0);
});
