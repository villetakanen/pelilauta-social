import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Set different timeouts for different test types
    testTimeout: 10000, // 10 seconds for most tests
    hookTimeout: 15000, // 15 seconds for setup/teardown hooks
  },
});
