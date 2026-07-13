import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Include test files, test for the test files, spec for playwright e2e tests
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Set different timeouts for different test types
    testTimeout: 10000, // 10 seconds for most tests
    hookTimeout: 15000, // 15 seconds for setup/teardown hooks
  },
});
