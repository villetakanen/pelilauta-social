import { expect, type Page, test } from '@playwright/test';
import { existingUser } from '../../../credentials.ts';

/**
 * Tests cover the agreement scenarios in specs/pelilauta/session/spec.md.
 * Tests evaluate session endpoint traffic on reload against the live cookie, verifier, and store.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const SESSION_PATH = '/api/auth/session';
const creationPages = ['/', '/channels/yleinen'];
// Matches e2e/reset-fixtures.mjs's THREAD_KEY.
const THREAD_KEY = 'e2e-onboarding-regression-thread';

const sessionResponse = (page: Page, method: string) =>
  page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === SESSION_PATH &&
      response.request().method() === method,
    { timeout: 30000 },
  );

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  const emailField = page.locator('#password-email');
  await emailField.waitFor({ state: 'visible' });
  await emailField.fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  // Login writes a saved UID hint before redirecting. Await the front page status check before checking session state.
  const settled = sessionResponse(page, 'GET');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  expect((await settled).status()).toBe(200);
  await expectActive(page);
}

// The inbox link renders only for a verified active session.
const inboxLink = (page: Page) => page.locator('a[href="/inbox"]:visible');

async function expectActive(page: Page) {
  await expect(inboxLink(page).first()).toBeVisible();
}

// The thread reply bar renders only for a verified active session.
const replyBar = (page: Page) => page.locator('.cn-chat-bar textarea');

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

for (const path of creationPages) {
  const creationLink = (page: Page) =>
    page.locator('a[href^="/create/thread"]');

  test(`${path} creation waits for verified session agreement`, async ({
    page,
  }) => {
    await signIn(page);
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let dispatched!: () => void;
    const requested = new Promise<void>((resolve) => {
      dispatched = resolve;
    });
    await page.route(`**${SESSION_PATH}`, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      dispatched();
      await held;
      await route.continue();
    });
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
    await requested;
    expect(
      await page.evaluate(() => localStorage.getItem('session-uid')),
    ).not.toBe('');
    await page.waitForTimeout(1000);
    await expect(creationLink(page)).toHaveCount(0);
    release();
    await expect(creationLink(page)).toBeVisible();
    await expect(creationLink(page)).toHaveAttribute(
      'href',
      path === '/' ? '/create/thread' : '/create/thread?channel=yleinen',
    );
  });

  for (const failure of ['verification', 'repair']) {
    test(`${path} creation stays hidden after failed ${failure}`, async ({
      page,
    }) => {
      await signIn(page);
      await page.route(`**${SESSION_PATH}`, async (route) => {
        const method = route.request().method();
        if (method === 'GET' || method === 'POST') {
          return route.fulfill({
            status: failure === 'repair' && method === 'GET' ? 401 : 503,
            contentType: 'application/json',
            body: '{}',
          });
        }
        return route.continue();
      });
      const failed = sessionResponse(
        page,
        failure === 'repair' ? 'POST' : 'GET',
      );
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      expect((await failed).status()).toBe(503);
      await page.waitForTimeout(1000);
      expect(
        await page.evaluate(() => localStorage.getItem('session-uid')),
      ).not.toBe('');
      await expect(creationLink(page)).toHaveCount(0);
      if (path !== '/') {
        await expect(page.locator('a.fab[href="/login"]')).toBeVisible();
      }
    });
  }

  test(`${path} a saved UID without Firebase authentication enables no creation`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('session-uid', 'saved-member');
    });
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
    expect(
      await page.evaluate(async () => {
        const { auth } = await import('/src/firebase/client/index.ts');
        await auth.authStateReady();
        return auth.currentUser;
      }),
    ).toBeNull();
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => localStorage.getItem('session-uid'))).toBe(
      'saved-member',
    );
    await expect(creationLink(page)).toHaveCount(0);
    if (path !== '/') {
      await expect(page.locator('a.fab[href="/login"]')).toBeVisible();
    }
  });
}

test('logout waits for cookie repair and leaves no restored identity', async ({
  page,
}) => {
  await signIn(page);
  await page.context().clearCookies({ name: 'session' });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let dispatched!: () => void;
  const created = new Promise<void>((resolve) => {
    dispatched = resolve;
  });
  await page.route(`**${SESSION_PATH}`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    dispatched();
    await held;
    await route.fulfill({ response });
  });
  const methods = sessionRequests(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await created;
  await page.evaluate(async () => {
    const { logout } = await import('/src/stores/session/index.ts');
    void logout();
  });
  expect(methods).not.toContain('DELETE');
  const deleted = sessionResponse(page, 'DELETE');
  release();
  expect((await deleted).ok()).toBe(true);
  await expect(inboxLink(page)).toHaveCount(0);
  expect(await hasSessionCookie(page)).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('session-uid'))).toBe(
    '',
  );
});

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
  // A repair dispatches immediately after the status check. The timeout allows any trailing request to arrive.
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

test('a saved sign-in shows no signed-in controls until the status check returns', async ({
  page,
}) => {
  await signIn(page);

  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let dispatched!: () => void;
  const requested = new Promise<void>((resolve) => {
    dispatched = resolve;
  });
  await page.route(`**${SESSION_PATH}`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    dispatched();
    await held;
    await route.continue();
  });
  await page.goto(`${BASE_URL}/threads/${THREAD_KEY}`, {
    waitUntil: 'domcontentloaded',
  });
  await requested;
  // The saved UID persists while verification is pending.
  expect(
    await page.evaluate(() => localStorage.getItem('session-uid')),
  ).not.toBe('');
  await page.waitForTimeout(1000);
  await expect(replyBar(page)).toHaveCount(0);
  await expect(inboxLink(page)).toHaveCount(0);

  release();
  await expect(replyBar(page)).toBeVisible();
});
