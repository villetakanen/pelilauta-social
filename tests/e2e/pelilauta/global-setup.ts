/**
 * The acceptance suite's global setup: one known state, one running application,
 * one sign-in, before the first spec.
 *
 * `docs/ACCEPTANCE_TESTING.md` states the model. This runs, in order:
 *
 * 1. `reset-and-seed.ts`, as its own Node process, because it loads the
 *    application's zod schemas through a module-resolution hook (see that file);
 * 2. the dev server — reused when one already answers, started and stopped here
 *    when none does;
 * 3. existingUser's sign-in, through the login form, saved as Playwright storage
 *    state for every spec's browser context.
 *
 * The sign-in drives the real login form. Minting a session instead would change
 * authentication on a surface v21 shares with live v18, which
 * `plans/debt/e2e-signs-in-through-the-form.md` holds for its own epic.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { existingUser } from '../../../credentials';
import { BASE_URL, STORAGE_STATE_PATH } from './harness';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../..');

/** Milliseconds to wait for a dev server this setup started to answer. */
const SERVER_START_TIMEOUT = 180_000;

let devServer: ChildProcess | undefined;

async function isServerUp(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, { redirect: 'manual' });
    return response.status > 0;
  } catch {
    return false;
  }
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

async function startDevServer(): Promise<void> {
  console.log('[uat] no application at', BASE_URL, '- starting a dev server');
  const port = new URL(BASE_URL).port || '4321';
  devServer = spawn('pnpm', ['--filter', 'pelilauta', 'dev', '--port', port], {
    cwd: repoRoot,
    stdio: 'inherit',
    /*
     * Astro 7 daemonises `astro dev` when it detects an agent environment, and
     * the child then exits immediately. Setting this to any value turns the
     * detection off and keeps the server in the foreground — the name reads
     * backwards, because the variable's other job is to request the background
     * explicitly. `apps/design/playwright.config.ts` carries the same note.
     */
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' },
  });

  // A dev server that gives up says so and exits — Astro refuses to start a
  // second one on the same project. Without this the wait would spin out the
  // whole timeout on a server that is already gone.
  let exitCode: number | null = null;
  devServer.on('exit', (code) => {
    exitCode = code;
  });

  const deadline = Date.now() + SERVER_START_TIMEOUT;
  while (Date.now() < deadline) {
    if (await isServerUp()) return;
    if (exitCode !== null) {
      throw new Error(
        `The dev server exited with ${exitCode} before it answered.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The dev server did not answer at ${BASE_URL} in time.`);
}

async function signInExistingUser(): Promise<void> {
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`);
  // The login form is a client-only island; it exists once it has hydrated.
  await page.locator('#password-email').waitFor({ state: 'visible' });
  await page.locator('#password-email').fill(existingUser.email);
  await page.locator('#password-password').fill(existingUser.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // A signed-in reader lands on the front page, and the login route redirects
  // them away from the form for as long as the session holds.
  await page.waitForURL(`${BASE_URL}/`);
  await page.goto(`${BASE_URL}/library`);
  await page.waitForURL(`${BASE_URL}/library`);

  // Firebase Auth keeps the client session in IndexedDB, and the server session
  // in a cookie. A spec's context needs both.
  await context.storageState({ path: STORAGE_STATE_PATH, indexedDB: true });
  await browser.close();
  console.log('[uat] signed in as', existingUser.email);
}

export async function setup(): Promise<void> {
  await run('node', [
    '--import',
    './tests/e2e/pelilauta/schema-resolver-loader.mjs',
    './tests/e2e/pelilauta/reset-and-seed.ts',
  ]);

  if (await isServerUp()) {
    console.log('[uat] reusing the application already running at', BASE_URL);
  } else {
    await startDevServer();
  }

  await signInExistingUser();
}

export async function teardown(): Promise<void> {
  devServer?.kill();
}
