import { expect, type Page, test } from '@playwright/test';
// Credentials live at the repository root, gitignored. See e2e/README.md.
import { existingUser } from '../../../credentials.ts';

/**
 * Scenarios "Keep a matching cookie" and "Repair a cookie before accepting
 * agreement" (HTTP 401) in specs/pelilauta/session/spec.md.
 *
 * The signal is the session endpoint's traffic on reload, against the real
 * cookie, verifier and store.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const SESSION_PATH = '/api/auth/session';

const sessionResponse = (page: Page, method: string) =>
  page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === SESSION_PATH &&
      response.request().method() === method,
  );

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  // Login writes an active session hint before redirecting, so wait for the
  // front page's own status check instead of the hint.
  const settled = sessionResponse(page, 'GET');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  expect((await settled).status()).toBe(200);
  await expectActive(page);
}

async function expectActive(page: Page) {
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('session-state')))
    .toBe('active');
}

async function hasSessionCookie(page: Page) {
  const cookies = await page.context().cookies(BASE_URL);
  return cookies.some((cookie) => cookie.name === 'session');
}

function sessionRequests(page: Page) {
  const methods: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === SESSION_PATH) {
      methods.push(request.method());
    }
  });
  return methods;
}

test('a matching cookie is kept without a session POST', async ({ page }) => {
  await signIn(page);
  expect(await hasSessionCookie(page)).toBe(true);

  const methods = sessionRequests(page);
  const status = sessionResponse(page, 'GET');
  await page.reload({ waitUntil: 'domcontentloaded' });

  const response = await status;
  expect(response.status()).toBe(200);
  expect(Object.keys(await response.json()).sort()).toEqual([
    'expiresAt',
    'uid',
  ]);
  await expectActive(page);
  // A repair would follow the status response at once; allow it to show.
  await page.waitForTimeout(1000);
  expect(methods).toEqual(['GET']);
});

test('a missing cookie is repaired by one POST before the session is active', async ({
  page,
}) => {
  await signIn(page);
  await page.context().clearCookies({ name: 'session' });
  expect(await hasSessionCookie(page)).toBe(false);

  const methods = sessionRequests(page);
  const status = sessionResponse(page, 'GET');
  const repair = sessionResponse(page, 'POST');
  await page.reload({ waitUntil: 'domcontentloaded' });

  expect((await status).status()).toBe(401);
  expect((await repair).status()).toBe(200);
  await expectActive(page);
  expect(await hasSessionCookie(page)).toBe(true);
  expect(methods).toEqual(['GET', 'POST']);
});
