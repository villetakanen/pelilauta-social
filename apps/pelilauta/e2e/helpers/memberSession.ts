import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

export function memberAuthFile(name: 'state.json' | 'response.json'): string {
  const directory = process.env.PELILAUTA_E2E_AUTH_DIR;
  if (!directory)
    throw new Error(
      'Run the browser suite with its authentication global setup.',
    );
  return join(directory, name);
}

export async function memberAuthResponse(): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(memberAuthFile('response.json'), 'utf8'));
}

export async function restoreMemberStorage(page: Page): Promise<void> {
  // Existing Firebase connections can block IndexedDB replacement until their document unloads.
  await page.goto('about:blank');
  await page.context().setStorageState(memberAuthFile('state.json'));
}

export async function restoreMemberSession(page: Page): Promise<void> {
  await restoreMemberStorage(page);
  const settled = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
    { timeout: 30000 },
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect((await settled).status()).toBe(200);
  await expect(page.locator('a[href="/inbox"]:visible').first()).toBeVisible();
}
