import { expect, type Page, test } from '@playwright/test';

/**
 * The shared shell is the one thing every book now depends on, so a regression
 * here breaks all of them at once. These assertions cover the guarantees the
 * navigation makes: every book reachable from every book, exactly one current
 * location, a keyboard route into the content, and a working disclosure on a
 * small viewport.
 */

/** Every published book: nav label and its URL. */
const BOOKS = [
  { label: 'Iconography', href: '/principles/iconography' },
  { label: 'Color themes', href: '/tokens/color' },
  { label: 'Icon', href: '/components/icon' },
] as const;

const GROUPS = ['Principles', 'Tokens', 'Components'] as const;

const collectConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

const nav = (page: Page) =>
  page.getByRole('navigation', { name: 'Design system books' });

test('every book and the index reach every other book', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  for (const from of ['/', ...BOOKS.map((book) => book.href)]) {
    await page.goto(from);

    // The full catalog is present, not just the current group.
    for (const group of GROUPS) {
      await expect(nav(page).getByText(group, { exact: true })).toBeVisible();
    }
    for (const book of BOOKS) {
      await expect(
        nav(page).getByRole('link', { name: book.label, exact: true }),
      ).toHaveAttribute('href', book.href);
    }
  }

  expect(errors).toEqual([]);
});

test('the current location is marked exactly once and matches the heading', async ({
  page,
}) => {
  for (const book of BOOKS) {
    await page.goto(book.href);

    const current = page.locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(book.label);

    // Frontmatter is the single source of the title: the nav label and the
    // book's own h1 must not be able to drift apart.
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveText(book.label);
  }

  // On the index the marked location is the index itself, not a book.
  await page.goto('/');
  const current = page.locator('[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('Index');
});

test('the skip link is the first focusable element and targets the content', async ({
  page,
}) => {
  await page.goto('/tokens/color');

  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('href', '#content');
  await expect(focused).toBeVisible();

  await expect(page.locator('main#content')).toBeAttached();
});

test('the navigation is reachable on a small viewport through the disclosure', async ({
  page,
}) => {
  const errors = collectConsoleErrors(page);
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/tokens/color');

  // Closed by default, and its links are not merely off-screen: a hidden nav
  // must not keep focusable links behind the viewport edge.
  await expect(nav(page)).not.toBeVisible();
  await expect(
    nav(page).getByRole('link', { name: 'Icon', exact: true }),
  ).not.toBeVisible();

  const disclosure = page.getByText('Browse', { exact: true });
  await expect(disclosure).toBeVisible();
  await disclosure.click();

  await expect(nav(page)).toBeVisible();
  const link = nav(page).getByRole('link', { name: 'Icon', exact: true });
  await expect(link).toBeVisible();

  // And it actually navigates.
  await link.click();
  await expect(page).toHaveURL(/\/components\/icon\/?$/);

  expect(errors).toEqual([]);
});
