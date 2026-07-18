#!/usr/bin/env node
/**
 * Regenerate the committed web representation `styles/tokens.css` from
 * the canonical DTCG source in `tokens/`. Exits non-zero without writing
 * when the source is invalid or the projection reports errors.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateTokenDirectory } from "./lib/dtcg.mjs";
import { projectTokens, renderCss } from "./lib/projection.mjs";

const tokensDir =
  process.argv[2] ?? fileURLToPath(new URL("../tokens/", import.meta.url));
const cssFile =
  process.argv[3] ??
  fileURLToPath(new URL("../styles/tokens.css", import.meta.url));

const source = validateTokenDirectory(tokensDir);
const projection =
  source.errors.length === 0
    ? projectTokens(source.tokens)
    : { errors: [], declarations: [] };
const errors = [...source.errors, ...projection.errors];

if (errors.length > 0) {
  console.error(
    `tokens: ${errors.length} error(s); styles/tokens.css not written`,
  );
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

mkdirSync(dirname(cssFile), { recursive: true });
writeFileSync(cssFile, renderCss(projection.declarations));
console.log(
  `styles/tokens.css: ${projection.declarations.length} declaration(s) from ${source.tokens.size} token(s)`,
);
