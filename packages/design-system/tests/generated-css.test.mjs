import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateTokenDirectory } from "../scripts/lib/dtcg.mjs";
import { projectTokens, renderCss } from "../scripts/lib/projection.mjs";

const tokensDir = fileURLToPath(new URL("../tokens/", import.meta.url));
const cssFile = fileURLToPath(new URL("../styles/tokens.css", import.meta.url));

test("committed styles/tokens.css matches regenerated canonical output", () => {
  const source = validateTokenDirectory(tokensDir);
  assert.deepEqual(source.errors, []);
  const projection = projectTokens(source.tokens);
  assert.deepEqual(projection.errors, []);
  assert.equal(
    readFileSync(cssFile, "utf8"),
    renderCss(projection.declarations),
  );
});
