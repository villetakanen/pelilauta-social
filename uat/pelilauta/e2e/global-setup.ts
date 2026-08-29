/**
 * The acceptance suite's global setup: one known state, one running application,
 * one sign-in, before the first spec.
 *
 * `docs/ACCEPTANCE_TESTING.md` states the model. This runs, in order:
 *
 * 1. `reset-and-seed.ts`, as its own Node process, because it loads the
 *    application's zod schemas through a module-resolution hook (see that file);
 * 2. the subject check — this setup starts no server. The operator or CI starts
 *    the application under acceptance, and the check fails the run unless the
 *    page at BASE_URL carries the repository's version;
 * 3. each example reader's sign-in, through the login form, saved as Playwright
 *    storage state for every spec's browser context.
 *
 * The sign-in drives the real login form. Minting a session instead would change
 * authentication on a surface v21 shares with live v18, which
 * `plans/debt/e2e-signs-in-through-the-form.md` holds for its own epic.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { chromium } from 'playwright';
import { adminUser, existingUser, newUser } from '../../../credentials';
import { BASE_URL, STORAGE_STATE_PATHS } from './harness';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');

loadEnv({ path: join(repoRoot, 'apps/pelilauta/.env') });

/**
 * Acceptance asserts about the merge candidate, so the server has to be the
 * merge candidate: any process answering the port would otherwise do. The
 * repository's version is on every front page, which makes the identity a
 * substring check.
 */
async function requireServer(): Promise<void> {
  let html: string;
  try {
    const response = await fetch(BASE_URL, {
      signal: AbortSignal.timeout(5000),
    });
    html = await response.text();
  } catch {
    throw new Error(
      `[uat] nothing answers at ${BASE_URL} — start the application under acceptance, then rerun.`,
    );
  }

  const { version } = JSON.parse(
    readFileSync(join(repoRoot, 'package.json'), 'utf8'),
  ) as { version: string };
  if (!html.includes(version)) {
    throw new Error(
      `[uat] the server at ${BASE_URL} does not serve ${version} — start the build you intend to accept.`,
    );
  }
  console.log(
    '[uat] accepting the application at',
    BASE_URL,
    'serving',
    version,
  );
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function signInUser(
  user: { email: string; password: string },
  storagePath: string,
): Promise<void> {
  mkdirSync(dirname(storagePath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  // The login form is a client-only island; it exists once it has hydrated.
  await page
    .locator('#password-email')
    .waitFor({ state: 'visible', timeout: 60_000 });
  await page.locator('#password-email').fill(user.email);
  await page.locator('#password-password').fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // A signed-in reader lands on the front page, and the login route redirects
  // them away from the form for as long as the session holds.
  await page.waitForURL(`${BASE_URL}/`, { timeout: 60_000 });

  /*
   * The client session activates when the AuthManager island hydrates and
   * writes the reader's uid to localStorage. Saving before that races the
   * island: the state then carries the server cookie and an empty client
   * session, and a spec on a route without AuthManager — an editor — is
   * signed in on the server and signed out on the client.
   */
  await page.waitForFunction(
    () => (window.localStorage.getItem('session-uid') ?? '') !== '',
    undefined,
    { timeout: 60_000 },
  );

  // Firebase Auth keeps the client session in IndexedDB, and the server session
  // in a cookie. A spec's context needs both.
  await context.storageState({ path: storagePath, indexedDB: true });
  await browser.close();
  console.log('[uat] signed in as', user.email);
}

export async function setup(): Promise<void> {
  await run('node', [
    '--import',
    './uat/pelilauta/e2e/schema-resolver-loader.mjs',
    './uat/pelilauta/e2e/reset-and-seed.ts',
  ]);

  await requireServer();

  await signInUser(existingUser, STORAGE_STATE_PATHS.existingUser);
  await signInUser(adminUser, STORAGE_STATE_PATHS.adminUser);
  await signInUser(newUser, STORAGE_STATE_PATHS.newUser);
}
