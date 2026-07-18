import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateTokenDirectory } from "../scripts/lib/dtcg.mjs";

const tokensDir = fileURLToPath(new URL("../tokens/", import.meta.url));

test("canonical tokens/ directory conforms to the supported DTCG scope", () => {
  const { files, errors } = validateTokenDirectory(tokensDir);
  assert.ok(files.length > 0, "tokens/ must contain at least one .tokens.json");
  assert.deepEqual(errors, []);
});
