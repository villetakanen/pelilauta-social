import { type Page, expect, test } from "@playwright/test";

// Expected square dimensions at the default 16px root font size, from the
// design-system icon sizing tokens.
const SIZE_PX: Record<string, number> = {
	xsmall: 16,
	small: 24,
	medium: 36,
	large: 72,
	xlarge: 128,
};

async function box(page: Page, selector: string) {
	return page.locator(selector).first().evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { w: Math.round(r.width), h: Math.round(r.height) };
	});
}

async function color(page: Page, selector: string) {
	return page
		.locator(selector)
		.first()
		.evaluate((el) => getComputedStyle(el).color);
}

test("icon book renders the component server-side across sizes, color, and tiers", async ({
	page,
}) => {
	const consoleErrors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});

	await page.goto("/components/icon");
	await expect(page.getByRole("heading", { name: "Icon", level: 1 })).toBeVisible();

	// Every supported size renders a square box at its token dimension.
	for (const [size, px] of Object.entries(SIZE_PX)) {
		const { w, h } = await box(page, `[data-size="${size}"] .cn-icon`);
		expect(w, `${size} width`).toBe(h);
		expect(Math.abs(w - px), `${size} is ${px}px`).toBeLessThanOrEqual(1);
	}

	// Monochrome artwork follows its surrounding foreground: different contexts
	// in the same panel produce different icon colors, and each matches its row.
	const linkRow = ".theme-panel.light .context-row[style*='--cn-link']";
	const lowRow = ".theme-panel.light .context-row[style*='--cn-text-low']";
	const linkIconColor = await color(page, `${linkRow} .cn-icon`);
	const lowIconColor = await color(page, `${lowRow} .cn-icon`);
	expect(linkIconColor).toBe(await color(page, linkRow));
	expect(lowIconColor).toBe(await color(page, lowRow));
	expect(linkIconColor).not.toBe(lowIconColor);

	// The same monochrome context resolves to different colors in Light vs Dark.
	const lightLink = await color(page, `${linkRow} .cn-icon`);
	const darkLink = await color(
		page,
		".theme-panel.dark .context-row[style*='--cn-link'] .cn-icon",
	);
	expect(lightLink).not.toBe(darkLink);

	// Branded artwork keeps its encoded color rather than inheriting.
	await expect(page.locator('svg [fill="#BC0F0F"]').first()).toBeAttached();

	// Unknown noun renders the missing glyph with preserved layout and a title.
	const missing = page.locator('.tier-icon svg:has(title:text-is("no-such-noun-xyz"))');
	await expect(missing).toHaveAttribute("viewBox", "0 0 24 24");
	const missingBox = await box(page, ".tier-icon:has(title:text-is('no-such-noun-xyz'))");
	expect(missingBox.w).toBeGreaterThan(0);

	// Nouns are announced to assistive technology through the artwork title.
	await expect(page.locator('svg title:text-is("search")').first()).toBeAttached();

	expect(consoleErrors).toEqual([]);
});
