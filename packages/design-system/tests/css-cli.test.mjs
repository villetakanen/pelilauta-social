import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const generateScript = fileURLToPath(
  new URL("../scripts/generate-css.mjs", import.meta.url),
);
const validateScript = fileURLToPath(
  new URL("../scripts/validate-tokens.mjs", import.meta.url),
);

function createWorkspace(t, tree, css) {
  const root = mkdtempSync(join(tmpdir(), "pelilauta-design-tokens-"));
  const tokensDir = join(root, "tokens");
  const cssFile = join(root, "styles", "tokens.css");
  mkdirSync(tokensDir);
  mkdirSync(join(root, "styles"));
  writeFileSync(
    join(tokensDir, "reference.tokens.json"),
    JSON.stringify(tree),
  );
  if (css !== undefined) writeFileSync(cssFile, css);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { tokensDir, cssFile };
}

function run(script, tokensDir, cssFile) {
  return spawnSync(process.execPath, [script, tokensDir, cssFile], {
    encoding: "utf8",
  });
}

test("validation reports missing and stale generated CSS", (t) => {
  const { tokensDir, cssFile } = createWorkspace(t, {
    space: {
      grid: { $type: "dimension", $value: { value: 8, unit: "px" } },
    },
  });

  const missing = run(validateScript, tokensDir, cssFile);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /styles\/tokens\.css is missing/);

  const generated = run(generateScript, tokensDir, cssFile);
  assert.equal(generated.status, 0, generated.stderr);
  assert.equal(run(validateScript, tokensDir, cssFile).status, 0);

  writeFileSync(cssFile, "stale\n");
  const stale = run(validateScript, tokensDir, cssFile);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /styles\/tokens\.css is stale/);
});

test("generation reports invalid source without overwriting committed CSS", (t) => {
  const sentinel = "/* keep existing output */\n";
  const { tokensDir, cssFile } = createWorkspace(
    t,
    { color: { bad: { $type: "color", $value: {} } } },
    sentinel,
  );

  const result = run(generateScript, tokensDir, cssFile);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /needs an object \$value/);
  assert.doesNotMatch(result.stderr, /TypeError/);
  assert.equal(readFileSync(cssFile, "utf8"), sentinel);
});
