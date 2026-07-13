/**
 * Test user credentials for E2E tests
 * Re-exports credentials from the gitignored credentials file
 * and defines additional test users for multi-user scenarios
 */

export { existingUser, newUser } from '../playwright/.auth/credentials.ts';

/**
 * Second test user for multi-user scenarios (e.g., notification testing)
 * This user should be created manually in Firebase Auth console
 */
export const testUser2 = {
  email: process.env.TEST_USER_2_EMAIL || 'e2etest2@example.com',
  password: process.env.TEST_USER_2_PASSWORD || 'testpassword123',
};
