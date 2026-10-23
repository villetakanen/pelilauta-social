import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect, type FullConfig } from '@playwright/test';
import { existingUser } from '../../../credentials.ts';
import { restoreMemberSession } from './helpers/memberSession';

export default async function authenticationSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL;
  if (!baseURL)
    throw new Error('Browser authentication setup requires a baseURL.');
  const browser = await chromium.launch();
  let directory: string | undefined;
  try {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const project = await page.request.get('/api/test/firebase-config');
    expect(project.ok()).toBe(true);
    expect((await project.json()).projectId).toBe('skaldbase-test');

    await page.goto('/login');
    await page.locator('#password-email').fill(existingUser.email);
    await page.locator('#password-password').fill(existingUser.password);
    const authenticated = page.waitForResponse(
      (response) =>
        new URL(response.url()).hostname === 'identitytoolkit.googleapis.com' &&
        new URL(response.url()).pathname.endsWith(
          '/accounts:signInWithPassword',
        ),
      { timeout: 30000 },
    );
    const agreed = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/auth/session' &&
        response.request().method() === 'GET',
      { timeout: 30000 },
    );
    // A rejected password request ends setup before the later agreement check can complete.
    void agreed.catch(() => {});
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    const response = await authenticated;
    const body = await response.json();
    if (!response.ok()) {
      throw new Error(
        `Browser authentication setup failed: ${body.error?.message ?? response.status()}. The suite did not start.`,
      );
    }
    for (const field of ['idToken', 'refreshToken', 'localId']) {
      if (typeof body[field] !== 'string' || !body[field])
        throw new Error(`Authentication setup received no ${field}.`);
    }
    expect((await agreed).status()).toBe(200);
    await expect(
      page.locator('a[href="/inbox"]:visible').first(),
    ).toBeVisible();
    const state = await context.storageState({ indexedDB: true });
    // Application caches must not become a shared initial condition between tests.
    for (const origin of state.origins) {
      origin.localStorage = origin.localStorage.filter((entry) =>
        entry.name.startsWith('firebase:'),
      );
    }
    directory = await mkdtemp(join(tmpdir(), 'pelilauta-e2e-auth-'));
    await writeFile(join(directory, 'state.json'), JSON.stringify(state), {
      mode: 0o600,
    });
    await writeFile(join(directory, 'response.json'), JSON.stringify(body), {
      mode: 0o600,
    });
    process.env.PELILAUTA_E2E_AUTH_DIR = directory;

    const restoredContext = await browser.newContext({ baseURL });
    await restoreMemberSession(await restoredContext.newPage());
    await restoredContext.close();
    console.log(
      'Browser authentication: one password sign-in; isolated cookie and IndexedDB state ready.',
    );
  } catch (error) {
    if (directory) await rm(directory, { recursive: true, force: true });
    delete process.env.PELILAUTA_E2E_AUTH_DIR;
    throw error;
  } finally {
    await browser.close();
  }
  const authDirectory = directory;
  return async () => {
    if (authDirectory)
      await rm(authDirectory, { recursive: true, force: true });
    delete process.env.PELILAUTA_E2E_AUTH_DIR;
  };
}
