import { expect, type Page, test } from '@playwright/test';
import { existingUser } from '../../../credentials.ts';

/**
 * Tests cover the agreement scenarios in specs/pelilauta/session/spec.md.
 * Tests evaluate session endpoint traffic on reload against the live cookie, verifier, and store.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const SESSION_PATH = '/api/auth/session';
const creationPages = ['/', '/channels/yleinen'];
const SITE_PATH = '/sites/e2e-session-gates-site';
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

test('the anonymous rail login link opens the login form', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  const rail = page.getByRole('navigation', {
    name: 'Päävalikko',
    exact: true,
  });
  const login = rail.getByRole('link', { name: 'Kirjaudu', exact: true });
  await expect(login).toBeVisible();
  await expect(login).toBeEnabled();
  await expect(login).toHaveAttribute('href', '/login');
  await expect(rail.locator('a[href="/settings"]')).toHaveCount(0);
  await expect(
    rail.getByRole('link', { name: 'E2E Regression Member', exact: true }),
  ).toHaveCount(0);

  await login.click();
  await expect(page).toHaveURL(`${BASE_URL}/login`);
  await expect(
    page.getByRole('heading', { name: 'Kirjaudu', level: 1, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', {
      name: 'Kirjaudu sähköpostiosoitteellasi',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Lähetä linkki/ }),
  ).toBeVisible();
});

test('the signed-in rail profile link opens the reader settings', async ({
  page,
}) => {
  await signIn(page);
  const rail = page.getByRole('navigation', {
    name: 'Päävalikko',
    exact: true,
  });
  const identity = rail.getByRole('link', {
    name: 'E2E Regression Member',
    exact: true,
  });
  await expect(identity).toBeVisible();
  await expect(identity).toBeEnabled();
  await expect(identity).toHaveAttribute('href', '/settings');

  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url() === `${BASE_URL}/settings` &&
        response.headers()['content-type']?.includes('text/html') === true,
    ),
    identity.click(),
  ]);
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toMatch(/\bno-store\b/);
  await expect(page).toHaveURL(`${BASE_URL}/settings`);
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { name: 'Asetukset', level: 1, exact: true }),
  ).toBeVisible();
  const profile = main.getByRole('article').filter({
    has: page.getByText('E2E Regression Member', { exact: true }),
  });
  await expect(
    profile.getByText('E2E Regression Member', { exact: true }),
  ).toBeVisible();
  await expect(profile).toContainText('e2e-regression-member');
  await expect(
    page
      .getByRole('navigation', { name: 'Kirjasto', exact: true })
      .getByRole('link', {
        name: 'E2E Regression Member',
        exact: true,
      }),
  ).toHaveAttribute('aria-current', 'page');
});

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
  const editThread = page.locator(`a[href="/threads/${THREAD_KEY}/edit"]`);
  const deleteReply = page.locator(
    `a[href="/threads/${THREAD_KEY}/replies/e2e-reply-1/delete"]`,
  );
  const share = page.getByRole('button', {
    name: 'Jaa Blueskyssa',
    exact: true,
  });
  await expect(editThread).toHaveCount(0);
  await expect(deleteReply).toHaveCount(0);
  await expect(share).toHaveCount(0);

  release();
  await expect(replyBar(page)).toBeVisible();
  await expect(editThread).toBeVisible();
  await expect(deleteReply).toHaveCount(1);
  const props = await page
    .locator('astro-island[component-url$="/BlueskyCard.svelte"]')
    .getAttribute('props');
  if (JSON.parse(props ?? '{}').bskyFeatureEnabled?.[1])
    await expect(share).toBeVisible();
});

const adminLink = (page: Page) => page.locator('a[href="/admin"]');

const memberSurfaces = [
  {
    path: '/',
    selector: 'button[aria-label="Love"], button[aria-label="Tykkää"]',
  },
  { path: '/channels/yleinen', selector: 'form input[type="text"]' },
  { path: SITE_PATH, selector: `a[href="${SITE_PATH}/create/page"]` },
  { path: '/library', selector: 'a[href="/create/site"]' },
];

for (const surface of memberSurfaces) {
  test(`${surface.path} member tools and reads wait for verification`, async ({
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
    const memberReads: string[] = [];
    let collecting = false;
    page.once('framenavigated', () => {
      collecting = true;
    });
    page.on('request', (request) => {
      if (
        !collecting ||
        !request.url().includes('google.firestore.v1.Firestore/')
      )
        return;
      let body = request.postData() ?? '';
      try {
        body = decodeURIComponent(body);
      } catch {
        /* Inspect the raw body. */
      }
      if (
        body.includes('reactions/') ||
        body.includes('subscriptions/') ||
        (body.includes('collectionId') && body.includes('sites'))
      ) {
        memberReads.push(body);
      }
    });
    await page.goto(`${BASE_URL}${surface.path}`, {
      waitUntil: 'domcontentloaded',
    });
    await requested;
    await page.waitForTimeout(1000);
    const control = page.locator(surface.selector).first();
    if (surface.path.startsWith('/channels/'))
      await expect(control).toBeDisabled();
    else await expect(control).toHaveCount(0);
    expect(memberReads).toHaveLength(0);
    if (surface.path === SITE_PATH) {
      await expect(page.locator(`a[href="${SITE_PATH}/members"]`)).toHaveCount(
        0,
      );
      await expect(
        page.locator(`a[href="${SITE_PATH}/handouts"]`),
      ).toHaveAttribute('aria-disabled', 'true');
    }
    release();
    await expectActive(page);
    if (surface.path.startsWith('/channels/'))
      await expect(control).toBeEnabled();
    else await expect(control).toBeVisible();
    if (surface.path === SITE_PATH) {
      await expect(
        page.locator(`a[href="${SITE_PATH}/members"]`),
      ).toBeVisible();
      await expect(
        page.locator(`a[href="${SITE_PATH}/handouts"]`),
      ).not.toHaveAttribute('aria-disabled', 'true');
    }
    if (surface.path === '/library' || surface.path === '/') {
      await expect.poll(() => memberReads.length).toBeGreaterThan(0);
    }
  });
}

for (const failure of ['verification', 'repair', 'no Firebase user']) {
  test(`site owner tools remain hidden after ${failure}`, async ({ page }) => {
    if (failure === 'no Firebase user') {
      // Capture the fixture owner hint without copying Firebase persistence.
      await signIn(page);
      const savedUid = await page.evaluate(() =>
        localStorage.getItem('session-uid'),
      );
      await page.evaluate(async () => {
        const { logout } = await import('/src/stores/session/index.ts');
        await logout();
      });
      await page.addInitScript(
        (uid) => localStorage.setItem('session-uid', uid ?? ''),
        savedUid,
      );
    } else {
      await signIn(page);
      await page.route(`**${SESSION_PATH}`, async (route) => {
        if (
          route.request().method() === 'GET' ||
          route.request().method() === 'POST'
        ) {
          return route.fulfill({
            status:
              failure === 'repair' && route.request().method() === 'GET'
                ? 401
                : 503,
            contentType: 'application/json',
            body: '{}',
          });
        }
        return route.continue();
      });
    }
    const failed =
      failure === 'no Firebase user'
        ? null
        : sessionResponse(page, failure === 'repair' ? 'POST' : 'GET');
    await page.goto(`${BASE_URL}${SITE_PATH}`, {
      waitUntil: 'domcontentloaded',
    });
    if (failed) expect((await failed).status()).toBe(503);
    await page.waitForTimeout(1000);
    await expect(
      page.locator(`a[href="${SITE_PATH}/create/page"]`),
    ).toHaveCount(0);
    await expect(page.locator(`a[href="${SITE_PATH}/members"]`)).toHaveCount(0);
    await expect(
      page.locator(`a[href="${SITE_PATH}/toc/settings"]`),
    ).toHaveCount(0);
    await expect(
      page.locator(`a[href="${SITE_PATH}/handouts"]`),
    ).toHaveAttribute('aria-disabled', 'true');
  });
}

test('public thread HTML and island properties ignore the requesting identity', async ({
  page,
}) => {
  await signIn(page);
  const url = `${BASE_URL}/threads/${THREAD_KEY}`;
  const [member, anonymous] = await Promise.all([
    page.request.get(url),
    page.request.get(url, { headers: { Cookie: '' } }),
  ]);
  expect(member.ok()).toBe(true);
  expect(anonymous.ok()).toBe(true);
  const memberHtml = await member.text();
  expect(memberHtml).not.toContain('isAuthorOrAdmin');
  // Astro development telemetry varies independently of content and credentials.
  const withoutTimings = (html: string) =>
    html.replace(/ server-render-time="[^"]*"/g, '');
  expect(withoutTimings(await anonymous.text())).toBe(
    withoutTimings(memberHtml),
  );
});

// Supply administrative metadata to test presentation without changing server permissions.
async function presentSavedAdmin(page: Page) {
  await page.evaluate(async () => {
    const { uid } = await import('/src/stores/session/index.ts');
    const { account } = await import('/src/stores/session/account.ts');
    const { appMeta } = await import('/src/stores/metaStore/metaStore.ts');
    account.set({ uid: uid.get(), eulaAccepted: true });
    appMeta.set({ admins: [uid.get()] });
  });
}

test('administrative navigation waits for verification of the saved account', async ({
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
  await page.reload({ waitUntil: 'domcontentloaded' });
  await requested;
  await presentSavedAdmin(page);
  await expect(adminLink(page)).toHaveCount(0);
  release();
  await expectActive(page);
  await presentSavedAdmin(page);
  await expect(adminLink(page)).toBeVisible();
});

for (const failure of ['verification', 'repair', 'no Firebase user']) {
  test(`saved administrative data enables no navigation after ${failure}`, async ({
    page,
  }) => {
    if (failure === 'no Firebase user') {
      await page.addInitScript(() =>
        localStorage.setItem('session-uid', 'saved-admin'),
      );
      await page.goto(BASE_URL);
      await page.evaluate(async () => {
        const { auth } = await import('/src/firebase/client/index.ts');
        await auth.authStateReady();
      });
    } else {
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
      await page.reload({ waitUntil: 'domcontentloaded' });
      expect((await failed).status()).toBe(503);
    }
    await presentSavedAdmin(page);
    await expect(adminLink(page)).toHaveCount(0);
  });
}

test('the rail excludes another account profile during replacement and for a missing profile', async ({
  page,
}) => {
  await signIn(page);
  const identity = page.locator('a[href="/settings"]');
  await expect(identity).toHaveAccessibleName('E2E Regression Member');

  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    '**/google.firestore.v1.Firestore/Listen/**',
    async (route) => {
      await held;
      await route.continue();
    },
  );
  // Drive the consumer with a replacement identity while its real profile listener is held.
  await page.evaluate(async () => {
    const { authUser, sessionState, uid } = await import(
      '/src/stores/session/index.ts'
    );
    const { subscribeToProfile } = await import(
      '/src/stores/session/profile.ts'
    );
    sessionState.set('initial');
    authUser.set({ ...authUser.get(), uid: 'e2e-missing-rail-profile' });
    subscribeToProfile('e2e-missing-rail-profile');
    uid.set('e2e-missing-rail-profile');
    sessionState.set('active');
  });
  await expect(identity).toBeVisible();
  await expect(identity).toHaveAccessibleName('Asetukset');
  await expect(identity.locator('img')).toHaveCount(0);

  // Persistent data from another tab must not label the replacement account.
  await page.evaluate(async () => {
    const { profile } = await import('/src/stores/session/profile.ts');
    profile.set({
      key: 'previous-account',
      username: 'previous',
      nick: 'Previous Account',
      avatarURL: 'https://example.com/previous.png',
    });
  });
  await expect(identity).toHaveAccessibleName('Asetukset');
  await expect(identity.locator('img')).toHaveCount(0);
  // Store tests cover missing-document snapshots; drive the resulting presentation state here.
  await page.evaluate(async () => {
    const { unsubscribeFromProfile, profileMissing } = await import(
      '/src/stores/session/profile.ts'
    );
    unsubscribeFromProfile();
    profileMissing.set(true);
  });
  release();
  await expect(identity).toHaveAccessibleName('Asetukset');
  await expect(identity.locator('img')).toHaveCount(0);
});
