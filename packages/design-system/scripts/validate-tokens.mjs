#!/usr/bin/env node
/**
 * Non-mutating conformance check for the canonical DTCG source in
 * `tokens/`. Exits non-zero when any file is invalid.
 */

import { fileURLToPath } from "node:url";
import { validateTokenDirectory } from "./lib/dtcg.mjs";

const tokensDir = fileURLToPath(new URL("../tokens/", import.meta.url));
const { files, errors, tokens } = validateTokenDirectory(tokensDir);

if (errors.length > 0) {
  console.error(`tokens: ${errors.length} conformance error(s)`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `tokens: ${files.length} file(s), ${tokens.size} token(s), no conformance errors`,
);
