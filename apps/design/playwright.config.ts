import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	use: {
		baseURL: "http://127.0.0.1:4398",
		trace: "on-first-retry",
	},
	webServer: {
		command: "pnpm run dev --host 127.0.0.1 --port 4398",
		url: "http://127.0.0.1:4398/tokens/color",
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: "chromium",
			use: devices["Desktop Chrome"],
		},
	],
});
