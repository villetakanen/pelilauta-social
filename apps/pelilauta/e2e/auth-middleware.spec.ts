import { expect, test } from '@playwright/test';
import { authenticate } from './authenticate-e2e';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

test.describe.serial('Auth Middleware Gating', { tag: '@middleware' }, () => {
  test('should redirect incomplete user from protected route to onboarding', async ({
    page,
  }) => {
    // 1. Authenticate as a NEW user (implies missing claims potentially, or we force it)
    // The 'authenticate' helper with 'true' (isNewUser) usually sets up a user that lands on onboarding.
    await authenticate(page, true);

    // 2. Initial landing should be /onboarding
    await expect(page).toHaveURL(`${BASE_URL}/onboarding`);

    // 3. Try to force navigate to a protected route (e.g. /settings)
    console.log('Attempting to bypass onboarding to /settings...');
    await page.goto(`${BASE_URL}/settings`);

    // 4. Verification: Middleware should bounce us back to /onboarding
    // because claims (eula_accepted, account_created) are missing.
    await expect(page).toHaveURL(`${BASE_URL}/onboarding`);
  });

  test('should allow access to public routes for incomplete user', async ({
    page,
  }) => {
    await authenticate(page, true);

    // /onboarding is public (explicitly excluded) -> Allowed
    await expect(page).toHaveURL(`${BASE_URL}/onboarding`);

    // Try another public route if any?
    // e.g. /login (though unlikely to go there logged in)
    await page.goto(`${BASE_URL}/login`);
    // Should allow access (though UI might redirect if it detects user)
    // Middleware itself allows it.
    // We can just verify we didn't get a 500 error or loop.
  });
});
