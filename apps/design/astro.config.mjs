// @ts-check
import { fileURLToPath } from "node:url";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import { optionalProprietary } from "../../packages/design-system/vite/optional-proprietary.mjs";

const designSystem = fileURLToPath(
	new URL("../../packages/design-system", import.meta.url),
);

export default defineConfig({
	site: "https://design.pelilauta.social",
	output: "static",
	integrations: [svelte()],
	vite: {
		resolve: {
			alias: {
				"@design-system": designSystem,
			},
		},
		plugins: [
			optionalProprietary(
				new URL("../../packages/myrrys-proprietary/index.ts", import.meta.url),
			),
		],
	},
});
