import { expect, test } from '@playwright/test';

const BOOK = '/components/cn-separator';

test.beforeEach(async ({ page }) => {
  await page.goto(BOOK);
  await expect(
    page.getByRole('heading', { name: 'CnSeparator', level: 1 }),
  ).toBeVisible();
});

test('renders the logomark between two hairlines when no noun is given', async ({
  page,
}) => {
  const figure = page.locator('figure', {
    hasText: 'The default logomark between two sections',
  });
  const separator = figure.locator('[data-mode="light"] .cn-separator').first();

  await expect(separator.locator('.line')).toHaveCount(2);

  const icon = separator.locator('.cn-icon');
  await expect(icon).toHaveAttribute('data-noun', 'fox');
});

test('renders a given noun in place of the logomark', async ({ page }) => {
  const figure = page.locator('figure', {
    hasText: 'A given noun replacing the logomark',
  });
  const separator = figure.locator('[data-mode="light"] .cn-separator').first();

  const icon = separator.locator('.cn-icon');
  await expect(icon).toHaveAttribute('data-noun', 'd20');
});

test('carries no accessible role or name', async ({ page }) => {
  const figure = page.locator('figure', {
    hasText: 'The default logomark between two sections',
  });
  const separator = figure.locator('[data-mode="light"] .cn-separator').first();

  await expect(separator).not.toHaveAttribute('role', /.+/);
  await expect(separator).not.toHaveAttribute('aria-label', /.+/);

  const svg = separator.locator('.cn-icon svg');
  await expect(svg).toHaveAttribute('aria-hidden', 'true');
  await expect(svg).not.toHaveAttribute('role', 'img');
  await expect(svg.locator('title')).toHaveCount(0);
});
