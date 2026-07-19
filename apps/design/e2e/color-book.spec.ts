import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const declarationPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
const designSystem = new URL(
	"../../../packages/design-system/",
	import.meta.url,
);
const declarationCount = (relativePath: string) =>
	[
		...readFileSync(new URL(relativePath, designSystem), "utf8").matchAll(
			declarationPattern,
		),
	].length;

test("color book renders the complete CSS contract", async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});

	await page.goto("/tokens/color");

	await expect(
		page.getByRole("heading", { name: "Color themes" }),
	).toBeVisible();
	await expect(page.locator("[data-reference-token]")).toHaveCount(
		declarationCount("styles/color-reference.css"),
	);
	await expect(page.locator("[data-semantic-token]")).toHaveCount(
		declarationCount("styles/color-theme.css"),
	);
	await expect(page.locator("[data-compat-token]")).toHaveCount(
		declarationCount("styles/compat/cyan-4.css"),
	);

	const lightBackground = page
		.locator(".theme-panel.light [data-computed='--cn-background']")
		.first();
	const darkBackground = page
		.locator(".theme-panel.dark [data-computed='--cn-background']")
		.first();
	await expect(lightBackground).not.toHaveText("computed in browser");
	await expect(darkBackground).not.toHaveText("computed in browser");
	expect(await lightBackground.textContent()).not.toBe(
		await darkBackground.textContent(),
	);
	expect(consoleErrors).toEqual([]);
});
