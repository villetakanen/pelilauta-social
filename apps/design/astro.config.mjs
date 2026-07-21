// @ts-check
import { fileURLToPath } from "node:url";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

const designSystem = fileURLToPath(
	new URL("../../packages/design-system", import.meta.url),
);
const myrrysProprietary = fileURLToPath(
	new URL("../../packages/myrrys-proprietary/index.ts", import.meta.url),
);

export default defineConfig({
	site: "https://design.pelilauta.social",
	output: "static",
	integrations: [svelte()],
	vite: {
		resolve: {
			alias: {
				"@design-system": designSystem,
				"@myrrys/proprietary": myrrysProprietary,
			},
		},
	},
});
