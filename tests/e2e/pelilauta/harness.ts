/**
 * What a spec needs from the harness: where the application is, and a browser
 * that is already signed in as existingUser.
 *
 * `docs/ACCEPTANCE_TESTING.md` states the model. The sign-in itself happens once,
 * in `global-setup.ts`, which leaves the browser state at STORAGE_STATE_PATH;
 * every spec's context loads it rather than driving the login form again.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Browser, chromium, type Page } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));

export const BASE_URL = process.env.UAT_BASE_URL ?? 'http://localhost:4321';

/**
 * The signed-in browser state, written by the global setup. Firebase Auth keeps
 * the client session in IndexedDB, and the server session in a cookie, so the
 * state has to carry both — hence `indexedDB: true` where it is saved.
 */
export const STORAGE_STATE_PATH = join(here, '.auth/existing-user.json');

/**
 * A page a signed-in reader drives, and the browser behind it. A spec closes the
 * browser when it is done.
 */
export async function openReaderPage(): Promise<{
  browser: Browser;
  page: Page;
}> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: STORAGE_STATE_PATH,
  });
  const page = await context.newPage();
  return { browser, page };
}

/**
 * A name no other run has used, so a journey that creates a site never collides
 * with what an earlier one left behind. The application derives the site's URL
 * key from the name, so the key is unique with it.
 */
export function uniqueSiteName(journey: string): string {
  return `Uat ${journey} ${Date.now()}`;
}
