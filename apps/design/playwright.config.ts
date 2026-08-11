import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4398',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm run dev --host 127.0.0.1 --port 4398',
    url: 'http://127.0.0.1:4398/tokens/color',
    reuseExistingServer: !process.env.CI,
    /*
     * Astro 7 daemonises `astro dev` when it detects an agent environment, and
     * Playwright then sees its web server exit immediately. Setting this to any
     * value turns the detection off and keeps the server in the foreground —
     * the name reads backwards, because the variable's other job is to request
     * the background explicitly.
     */
    env: { ASTRO_DEV_BACKGROUND: '1' },
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
});
