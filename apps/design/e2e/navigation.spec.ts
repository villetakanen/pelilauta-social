import { expect, type Page, test } from '@playwright/test';

/**
 * The design site's navigation is a placeholder, to be deleted. What is worth a
 * browser until then is what needs one: the small-viewport disclosure and the
 * keyboard route into the content. Everything else this file used to assert —
 * the catalogue, unique titles, active state — was driven by a hand-kept list of
 * books that went stale the first time one was added.
 */

const collectConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

const nav = (page: Page) =>
  page.getByRole('navigation', { name: 'Design system books' });

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
    nav(page).getByRole('link', { name: 'CnIcon', exact: true }),
  ).not.toBeVisible();

  // The tray's trigger stands in the leading slot CnAppBar reserves for it at
  // this width. It draws the checkbox beside it, which is the named control a
  // reader's assistive technology reports; the trigger is what a pointer hits.
  const disclosure = page.locator('.cn-rail-trigger.narrow');
  await expect(disclosure).toBeVisible();
  await disclosure.click();

  await expect(nav(page)).toBeVisible();
  const link = nav(page).getByRole('link', { name: 'CnIcon', exact: true });
  await expect(link).toBeVisible();

  // And it actually navigates.
  await link.click();
  await expect(page).toHaveURL(/\/components\/cn-icon\/?$/);

  expect(errors).toEqual([]);
});
