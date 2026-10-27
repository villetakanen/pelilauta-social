import { expect, test } from '@playwright/test';
import { restoreMemberSession } from './helpers/memberSession';

test('restored sessions are isolated from logout and do not mutate the saved template', async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto('/login');
  expect(
    await page.evaluate(async () => {
      const { auth } = await import('/src/firebase/client/index.ts');
      await auth.authStateReady();
      return auth.currentUser;
    }),
  ).toBeNull();
  await restoreMemberSession(page);
  const context = await browser.newContext({ baseURL });
  try {
    const other = await context.newPage();
    await restoreMemberSession(other);
    expect(
      await page.evaluate(async () => {
        const { logout } = await import('/src/stores/session/index.ts');
        return logout();
      }),
    ).toBe(true);
    await expect(page.locator('a[href="/inbox"]:visible')).toHaveCount(0);
    await other.reload();
    await expect(
      other.locator('a[href="/inbox"]:visible').first(),
    ).toBeVisible();
    await restoreMemberSession(page);
    await expect(
      page.locator('a[href="/inbox"]:visible').first(),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
