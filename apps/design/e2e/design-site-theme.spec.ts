import { expect, test } from '@playwright/test';

/**
 * What needs a browser is the restoration: that it reaches the root before the page
 * paints, that it survives absent, invalid and unreadable storage, and that an
 * activation is remembered across a navigation.
 *
 * A denied read is exercised against the extracted script rather than a loaded page:
 * revoking `localStorage` on the window also breaks the dev-server client, whose
 * uncaught error is not this capability's.
 */

const BOOK = '/components/cn-theme-switch';
const OTHER = '/tokens/color';
/** The specimen page: cells that scope `color-scheme` against the root's. */
const SCOPED = '/principles/color-system';

/** ThemeScript.astro owns this name; a test that guessed it would pass on nothing. */
const KEY = 'cn-design-theme';

const rootScheme = () => document.documentElement.style.colorScheme || '';

/** Storage that answers reads and rejects writes, as a full disk does. */
const denyWrites = `
  const store = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: () => { throw new DOMException('quota', 'QuotaExceededError') },
      removeItem: (key) => store.delete(key),
    },
  });
`;

/**
 * The restoration script, as the browser received it. Extracted rather than imported:
 * what runs before the paint is the text in the response, not a module.
 */
async function restorationScript(page: import('@playwright/test').Page) {
  const html = await (await page.request.get(BOOK)).text();
  const source = html
    .slice(0, html.indexOf('<body'))
    .match(/<script[^>]*>([\s\S]*?localStorage[\s\S]*?)<\/script>/)?.[1];
  expect(source).toBeTruthy();
  return source as string;
}

/**
 * Runs it against a storage of the test's making. Isolated from the page's own
 * storage, so a denial reaches this script and not the dev-server client.
 */
async function runAgainst(
  page: import('@playwright/test').Page,
  source: string,
  storage: string,
) {
  await page.goto(BOOK);
  return page.evaluate(
    ([src, stub]) => {
      document.documentElement.style.colorScheme = '';
      try {
        new Function('localStorage', src)(new Function(`return ${stub}`)());
      } catch (error) {
        return { scheme: '', threw: String(error) };
      }
      return {
        scheme: document.documentElement.style.colorScheme,
        threw: null,
      };
    },
    [source, storage],
  );
}

/** Reaching the origin once is what makes its storage writable. */
async function store(page: import('@playwright/test').Page, mode: string) {
  await page.goto(BOOK);
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [KEY, mode],
  );
}

/** The masthead's switch, not the one the CnThemeSwitch book renders as a specimen. */
async function activate(page: import('@playwright/test').Page) {
  // The control is an island: a click before it hydrates changes nothing.
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('banner')
    .getByRole('button', { name: 'Switch theme' })
    .click();
}

function errors(page: import('@playwright/test').Page) {
  const seen: string[] = [];
  page.on('pageerror', (error) => seen.push(error.message));
  return seen;
}

test.describe('the restoration script', () => {
  test('is classic and inline in the head, ahead of the body', async ({
    page,
  }) => {
    const html = await (await page.request.get(BOOK)).text();
    const head = html.slice(0, html.indexOf('<body'));

    expect(head).toContain('</head>');
    expect(head).toContain(KEY);
    expect(head).toContain('localStorage.getItem');
    // A module or a src would be deferred, and the body would paint first.
    expect(head).not.toMatch(
      /<script[^>]*\btype="module"[^>]*>[^<]*localStorage/,
    );
  });

  test('reaches every page the site publishes', async ({ page }) => {
    await page.goto('/');
    const paths = await page
      .getByRole('navigation')
      .getByRole('link')
      .evaluateAll((links) =>
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
      );
    expect(paths.length).toBeGreaterThan(1);

    const without: string[] = [];
    for (const path of ['/', ...paths]) {
      const html = await (await page.request.get(path)).text();
      if (
        !html.slice(0, html.indexOf('<body')).includes('localStorage.getItem')
      )
        without.push(path);
    }

    expect(without).toEqual([]);
  });

  test('writes the root before its own evaluation returns', async ({
    page,
  }) => {
    const source = await restorationScript(page);

    const result = await runAgainst(
      page,
      source,
      `{ getItem: () => 'light', setItem: () => {} }`,
    );

    expect(result).toEqual({ scheme: 'light', threw: null });
  });

  test('carries a denied read without throwing', async ({ page }) => {
    const source = await restorationScript(page);

    const result = await runAgainst(
      page,
      source,
      `{ getItem: () => { throw new DOMException('denied', 'SecurityError') } }`,
    );

    expect(result).toEqual({ scheme: '', threw: null });
  });
});

test.describe('with no mode stored', () => {
  test('the root stays unforced and the system preference paints', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BOOK);

    await expect(page.evaluate(rootScheme)).resolves.toBe('');
    await expect(
      page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches),
    ).resolves.toBe(true);
  });

  test('an invalid value leaves the root unforced', async ({ page }) => {
    const thrown = errors(page);
    await store(page, 'sepia');
    await page.reload();

    await expect(page.evaluate(rootScheme)).resolves.toBe('');
    expect(thrown).toEqual([]);
  });
});

test.describe('with a mode stored', () => {
  test('it overrides the system preference before content paints', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await store(page, 'light');
    await page.goto(SCOPED);

    await expect(page.evaluate(rootScheme)).resolves.toBe('light');
  });

  test('a specimen keeps the scheme it scopes for itself', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await store(page, 'light');
    await page.goto(SCOPED);

    const cell = (mode: string) =>
      page
        .locator(`.cell[data-mode="${mode}"][data-role="--cn-color-surface"]`)
        .first()
        .evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(await cell('dark')).not.toBe(await cell('light'));
  });

  test('it applies without the hydration bundles', async ({ page }) => {
    await store(page, 'dark');
    // Nothing may wait on the island: blocking its script must change nothing.
    await page.route('**/*.js', (route) => route.abort());
    await page.goto(BOOK);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
  });
});

test.describe('an activation', () => {
  test('is stored', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(BOOK);

    await activate(page);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
    await expect(
      page.evaluate((key) => localStorage.getItem(key), KEY),
    ).resolves.toBe('dark');
  });

  test('survives a navigation to another book', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(BOOK);

    await activate(page);
    await page.goto(OTHER);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
  });

  test('changes the document even when the write fails', async ({ page }) => {
    const thrown = errors(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(BOOK);
    await page.addInitScript(denyWrites);
    await page.reload();

    await activate(page);

    await expect(page.evaluate(rootScheme)).resolves.toBe('dark');
    expect(thrown).toEqual([]);
  });
});
