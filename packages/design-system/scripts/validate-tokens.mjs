#!/usr/bin/env node
/**
 * Non-mutating conformance check for the canonical DTCG source in
 * `tokens/` and its committed web representation `styles/tokens.css`.
 * Exits non-zero on invalid source, projection errors, or stale output.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateTokenDirectory } from "./lib/dtcg.mjs";
import { projectTokens, renderCss } from "./lib/projection.mjs";

const tokensDir =
  process.argv[2] ?? fileURLToPath(new URL("../tokens/", import.meta.url));
const cssFile =
  process.argv[3] ??
  fileURLToPath(new URL("../styles/tokens.css", import.meta.url));

const { files, errors, tokens } = validateTokenDirectory(tokensDir);
const projection =
  errors.length === 0
    ? projectTokens(tokens)
    : { errors: [], declarations: [] };
errors.push(...projection.errors);

if (errors.length === 0) {
  const expected = renderCss(projection.declarations);
  let committed;
  try {
    committed = readFileSync(cssFile, "utf8");
  } catch {
    errors.push(
      "styles/tokens.css is missing; run `pnpm --filter @pelilauta/design-system generate`",
    );
  }
  if (committed !== undefined && committed !== expected) {
    errors.push(
      "styles/tokens.css is stale; run `pnpm --filter @pelilauta/design-system generate`",
    );
  }
}

if (errors.length > 0) {
  console.error(`tokens: ${errors.length} conformance error(s)`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `tokens: ${files.length} file(s), ${tokens.size} token(s), generated CSS current`,
);
