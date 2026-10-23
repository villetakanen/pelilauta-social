import { expect, type Page, test } from '@playwright/test';
import { existingUser } from '../../../credentials.ts';
import {
  restoreMemberStorage,
  restoreMemberSession as signIn,
} from './helpers/memberSession';

const SESSION = '/api/auth/session';
const destination = '/settings?view=list&redirect=%2Finbox#latest';
const recovery = (page: Page) =>
  page.locator('[data-protected-recovery="401"]');
const retry = (page: Page) =>
  page.getByRole('button', { name: 'Yritä uudelleen', exact: true });
const isSession = (url: string) => new URL(url).pathname === SESSION;

async function expireCookie(page: Page) {
  await restoreMemberStorage(page);
  await page.context().clearCookies({ name: 'session' });
}

function memberListenRequests(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (
      !request.url().includes('firestore.googleapis.com') ||
      !request.url().includes('/Listen/')
    )
      return;
    let body = request.postData() ?? '';
    try {
      body = decodeURIComponent(body);
    } catch {}
    // The footer also subscribes to public profiles, independently of the requesting reader.
    if (
      /\/documents\/(?:account|subscriptions)\//.test(body) ||
      /"collectionId"\s*:\s*"(?:account|subscriptions)"/.test(body)
    ) {
      requests.push(request.url());
    }
  });
  return requests;
}

test('a rejected document repairs the cookie without protected content or member subscriptions', async ({
  page,
}) => {
  await expireCookie(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route(`**${SESSION}`, async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      await pending;
    }
    await route.continue();
  });
  const reads = memberListenRequests(page);
  try {
    const response = await page.goto(destination);
    expect(response?.status()).toBe(401);
    expect(response?.headers()['cache-control']).toBe('no-store');
    expect(response?.headers()['netlify-cdn-cache-control']).toBe('no-store');
    await expect(recovery(page)).toBeVisible();
    await expect.poll(() => posts).toBe(1);
    await expect(page).toHaveURL(
      /\/settings\?view=list&redirect=%2Finbox#latest$/,
    );
    await expect(
      page.locator('astro-island[component-url*="SettingsApp"]'),
    ).toHaveCount(0);
    expect(reads).toEqual([]);
    expect(
      await page.evaluate(async () => {
        const { sessionManagerStarted } = await import(
          '/src/stores/session/state.ts'
        );
        return sessionManagerStarted;
      }),
    ).toBe(false);
    release();
    await expect(
      page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveURL(
      /\/settings\?view=list&redirect=%2Finbox#latest$/,
    );
    expect(posts).toBe(1);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem(
          `pelilauta:protected-recovery:${location.pathname}${location.search}`,
        ),
      ),
    ).toBeNull();
  } finally {
    release();
  }
});

test('rail navigation into recovery crosses a full-document boundary before repair', async ({
  page,
}) => {
  await signIn(page);
  await page.context().clearCookies({ name: 'session' });
  let rejectedNavigations = 0;
  let rejectedTransitions = 0;
  let posts = 0;
  page.on('response', (response) => {
    if (
      new URL(response.url()).pathname !== '/settings' ||
      response.status() !== 401
    )
      return;
    if (response.request().isNavigationRequest()) {
      if (response.request().frame() === page.mainFrame())
        rejectedNavigations++;
    } else rejectedTransitions++;
  });
  page.on('request', (request) => {
    if (isSession(request.url()) && request.method() === 'POST') posts++;
  });
  await page
    .getByRole('navigation', { name: 'Päävalikko', exact: true })
    .getByRole('link', { name: 'E2E Regression Member', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
  ).toBeVisible();
  expect(rejectedNavigations).toBe(1);
  expect(rejectedTransitions).toBeGreaterThanOrEqual(1);
  expect(posts).toBe(1);
});

test('a fully signed-out reader sees choices without session requests', async ({
  page,
}) => {
  const methods: string[] = [];
  page.on('request', (request) => {
    if (isSession(request.url())) methods.push(request.method());
  });
  const response = await page.goto(destination);
  expect(response?.status()).toBe(401);
  await expect(recovery(page)).toContainText('Kirjaudu sisään jatkaaksesi.');
  await expect(page.locator('#email-login')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Google-tilillä/ }),
  ).toBeVisible();
  expect(methods).toEqual([]);
});

test('discarded repaired cookies cannot loop across reloads and explicit retry', async ({
  page,
}) => {
  await expireCookie(page);
  let posts = 0;
  await page.route(`**${SESSION}`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    posts++;
    const response = await route.fetch();
    const headers = response.headers();
    delete headers['set-cookie'];
    await page.context().clearCookies({ name: 'session' });
    await route.fulfill({ response, headers });
  });
  let recoveredDocuments = 0;
  page.on('response', (response) => {
    if (
      response.request().isNavigationRequest() &&
      new URL(response.url()).pathname === '/settings' &&
      response.status() === 401
    )
      recoveredDocuments++;
  });
  await page.goto(destination);
  await expect.poll(() => recoveredDocuments).toBe(2);
  await expect(recovery(page)).toContainText('Voit yrittää');
  expect(posts).toBe(1);
  await page.reload();
  await expect(recovery(page)).toContainText('Voit yrittää');
  expect(posts).toBe(1);
  await retry(page).click();
  await expect.poll(() => recoveredDocuments).toBe(4);
  await expect(recovery(page)).toContainText('Voit yrittää');
  expect(posts).toBe(2);
});

test('disabled tab storage requires explicit retry but still permits repair', async ({
  page,
}) => {
  await expireCookie(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Unavailable', 'SecurityError');
      },
    });
  });
  const methods: string[] = [];
  page.on('request', (request) => {
    if (isSession(request.url())) methods.push(request.method());
  });
  await page.goto(destination);
  await expect(recovery(page)).toContainText('Voit yrittää');
  expect(methods).toEqual([]);
  await retry(page).click();
  await expect(
    page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
  ).toBeVisible();
  expect(methods.filter((method) => method === 'POST')).toHaveLength(1);
});

test('temporary status failure preserves Firebase authentication for explicit retry', async ({
  page,
}) => {
  await expireCookie(page);
  let unavailable = true;
  const methods: string[] = [];
  await page.route(`**${SESSION}`, async (route) => {
    methods.push(route.request().method());
    if (unavailable && route.request().method() === 'GET')
      return route.fulfill({ status: 503, body: '' });
    await route.continue();
  });
  await page.goto(destination);
  await expect(recovery(page)).toContainText(
    'Kirjautuminen ei ole nyt käytettävissä.',
  );
  expect(methods).toEqual(['GET']);
  unavailable = false;
  await retry(page).click();
  await expect(
    page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
  ).toBeVisible();
  expect(methods.filter((method) => method === 'POST')).toHaveLength(1);
  expect(methods).not.toContain('DELETE');
});

test('rejected repair reports incomplete logout and never renders protected content', async ({
  page,
}) => {
  await expireCookie(page);
  const methods: string[] = [];
  await page.route(`**${SESSION}`, async (route) => {
    methods.push(route.request().method());
    if (route.request().method() === 'POST')
      return route.fulfill({ status: 401, body: '' });
    if (route.request().method() === 'DELETE')
      return route.fulfill({ status: 503, body: '' });
    await route.continue();
  });
  await page.goto(destination);
  await expect(recovery(page)).toContainText('Uloskirjautuminen jäi kesken.');
  expect(methods).toEqual(['GET', 'POST', 'DELETE']);
  await expect(
    page.locator('astro-island[component-url*="SettingsApp"]'),
  ).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('snack'))).toContain(
    'Uloskirjautuminen',
  );
  await expect(page.locator('#email-login')).toBeVisible();
});

test('a repaired identity still receives owner denial without starting recovery again', async ({
  page,
}) => {
  await expireCookie(page);
  let posts = 0;
  page.on('request', (request) => {
    if (isSession(request.url()) && request.method() === 'POST') posts++;
  });
  const response = await page.goto(
    '/sites/e2e-recovery-nonowner-site/settings',
  );
  expect(response?.status()).toBe(401);
  await expect(page.getByText('Forbidden', { exact: true })).toBeVisible();
  await expect(page.locator('[data-protected-recovery]')).toHaveCount(0);
  expect(posts).toBe(1);
});

test('interactive sign-in during recovery preserves the original query and fragment', async ({
  page,
}) => {
  await page.goto(destination);
  await expect(recovery(page)).toContainText('Kirjaudu sisään jatkaaksesi.');
  await page.locator('#password-email').fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveURL(
    /\/settings\?view=list&redirect=%2Finbox#latest$/,
  );
});

test('a valid cookie authorizes the document without restoring Firebase from it', async ({
  page,
  browser,
  baseURL,
}) => {
  await signIn(page);
  const cookies = await page.context().cookies();
  const context = await browser.newContext({ baseURL });
  try {
    await context.addCookies(
      cookies.filter((cookie) => cookie.name === 'session'),
    );
    const cookieOnly = await context.newPage();
    const methods: string[] = [];
    cookieOnly.on('request', (request) => {
      if (isSession(request.url())) methods.push(request.method());
    });
    const response = await cookieOnly.goto('/settings');
    expect(response?.status()).toBe(200);
    await expect(
      cookieOnly.getByRole('heading', {
        name: 'Asetukset',
        exact: true,
        level: 1,
      }),
    ).toBeVisible();
    await expect(cookieOnly.locator('[data-protected-recovery]')).toHaveCount(
      0,
    );
    await expect(cookieOnly.locator('a[href="/inbox"]:visible')).toHaveCount(0);
    expect(methods).toEqual([]);
  } finally {
    await context.close();
  }
});

test('a mismatched status identity is repaired before resource authorization', async ({
  page,
}) => {
  await expireCookie(page);
  let statusChecks = 0;
  let posts = 0;
  await page.route(`**${SESSION}`, async (route) => {
    if (route.request().method() === 'POST') posts++;
    if (route.request().method() === 'GET' && ++statusChecks === 1) {
      return route.fulfill({
        json: { uid: 'other-identity', expiresAt: 1900000000 },
      });
    }
    await route.continue();
  });
  await page.goto('/sites/e2e-session-gates-site/settings?view=list#latest');
  await expect(page.locator('[data-protected-recovery]')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
  ).toBeVisible();
  expect(posts).toBe(1);
  await expect(page).toHaveURL(
    /\/sites\/e2e-session-gates-site\/settings\?view=list#latest$/,
  );
});

test('retry and email sign-in remain usable during a stalled repair without competing navigation', async ({
  page,
}) => {
  await expireCookie(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route(`**${SESSION}`, async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      await pending;
    }
    await route.continue();
  });
  try {
    await page.goto(destination);
    await expect.poll(() => posts).toBe(1);
    await retry(page).click();
    expect(posts).toBe(1);
    await page.route('**/accounts:sendOobCode?*', (route) =>
      route.fulfill({ json: { email: existingUser.email } }),
    );
    await page.locator('#email-login').fill(existingUser.email);
    await page.getByRole('button', { name: /Lähetä linkki/ }).click();
    await expect(
      page.getByText('Linkki lähetetty sähköpostiisi.', { exact: false }),
    ).toBeVisible();
    const created = page.waitForResponse(
      (response) =>
        isSession(response.url()) && response.request().method() === 'POST',
    );
    release();
    await (await created).finished();
    await expect(recovery(page)).toContainText('Voit yrittää');
    await retry(page).click();
    await expect(
      page.getByRole('heading', { name: 'Asetukset', exact: true, level: 1 }),
    ).toBeVisible();
    expect(posts).toBe(1);
    await expect(page).toHaveURL(
      /\/settings\?view=list&redirect=%2Finbox#latest$/,
    );
  } finally {
    release();
  }
});

test('rejected repair completes cookie deletion and Firebase sign-out without starting member reads', async ({
  page,
}) => {
  await expireCookie(page);
  const methods: string[] = [];
  await page.route(`**${SESSION}`, async (route) => {
    methods.push(route.request().method());
    if (route.request().method() === 'POST')
      return route.fulfill({ status: 401, body: '' });
    await route.continue();
  });
  await page.goto(destination);
  await expect(recovery(page)).toContainText(
    'Kirjautumisen palauttaminen epäonnistui.',
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('session-uid') ?? ''))
    .toBe('');
  expect(methods).toEqual(['GET', 'POST', 'DELETE']);
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === 'session',
    ),
  ).toBe(false);
  await expect(
    page.locator('astro-island[component-url*="SettingsApp"]'),
  ).toHaveCount(0);
});

test('without JavaScript recovery retains pathname and query in the login link', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(destination);
    expect(response?.status()).toBe(401);
    await expect(page.locator('noscript p')).toBeVisible();
    await expect(page.locator('noscript p')).toContainText(
      'Selaimen kirjautumisen palauttaminen vaatii JavaScriptin.',
    );
    await expect(page.locator('noscript a[href^="/login?"]')).toHaveAttribute(
      'href',
      '/login?redirect=%2Fsettings%3Fview%3Dlist%26redirect%3D%252Finbox',
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.getByRole('navigation')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('HEAD, API, mutation, and caller-supplied recovery flags never enter document recovery', async ({
  page,
}) => {
  const head = await page.request.head('/settings');
  expect(head.status()).toBe(401);
  expect(await head.body()).toHaveLength(0);
  const api = await page.request.get(SESSION);
  expect(api.status()).toBe(401);
  expect(await api.text()).not.toContain('RecoveryPanel');
  const post = await page.request.post('/settings', {
    data: 'submitted',
    maxRedirects: 0,
  });
  expect(post.status()).toBe(302);
  expect(post.headers().location).toBe('/login?redirect=%2Fsettings');
  const direct = await page.request.get('/login?recovery=1&status=503', {
    headers: { 'X-Recovery-Status': '503' },
  });
  expect(direct.status()).toBe(200);
  expect(await direct.text()).not.toContain('RecoveryPanel');
});
