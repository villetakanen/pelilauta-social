import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeTokenTrees,
  parseAlias,
  validateTokenTree,
} from "../scripts/lib/dtcg.mjs";

const RED = {
  $type: "color",
  $value: { colorSpace: "oklch", components: [0.6, 0.2, 30] },
};

test("a valid tree with inheritance and aliases has no errors", () => {
  const { errors, tokens } = validateTokenTree({
    color: {
      $type: "color",
      primary: {
        $description: "Primary tonal scale",
        "70": { $value: { colorSpace: "oklch", components: [0.7, 0.1, 250] } },
      },
      error: { "50": { $value: "{color.primary.70}" } },
    },
    space: {
      grid: { $type: "dimension", $value: { value: 8, unit: "px" } },
    },
    font: {
      family: { body: { $type: "fontFamily", $value: ["Lato", "sans-serif"] } },
      weight: { bold: { $type: "fontWeight", $value: 700 } },
    },
    "line-height": {
      body: { $type: "number", $value: 1.5 },
    },
  });
  assert.deepEqual(errors, []);
  assert.equal(tokens.size, 6);
  assert.ok(tokens.has("color.primary.70"));
  assert.ok(tokens.has("line-height.body"));
});

test("an empty document is a valid structure with zero tokens", () => {
  const { errors, tokens } = validateTokenTree({ $description: "empty" });
  assert.deepEqual(errors, []);
  assert.equal(tokens.size, 0);
});

test("a token without an explicit or inherited $type is invalid", () => {
  const { errors } = validateTokenTree({
    space: { grid: { $value: { value: 8, unit: "px" } } },
  });
  assert.ok(errors.some((e) => e.includes('no explicit or inherited $type')));
});

test("a $type outside the supported DTCG scope is rejected", () => {
  const { errors } = validateTokenTree({
    motion: { fast: { $type: "duration", $value: { value: 100, unit: "ms" } } },
  });
  assert.ok(errors.some((e) => e.includes('unsupported $type "duration"')));
});

test("unknown $-prefixed properties are rejected, not ignored", () => {
  const { errors } = validateTokenTree({
    color: { $root: true, red: RED },
  });
  assert.ok(errors.some((e) => e.includes('unsupported property "$root"')));
});

test("names may not contain braces or dots", () => {
  const { errors } = validateTokenTree({
    "color.primary": { red: RED },
  });
  assert.ok(errors.some((e) => e.includes('must not contain')));
});

test("a token may not contain child nodes", () => {
  const { errors } = validateTokenTree({
    color: { red: { ...RED, darker: RED } },
  });
  assert.ok(errors.some((e) => e.includes('must not contain child node')));
});

test("aliases must resolve to an existing token", () => {
  const { errors } = validateTokenTree({
    color: { $type: "color", primary: { $value: "{color.missing}" } },
  });
  assert.ok(errors.some((e) => e.includes('unknown token "{color.missing}"')));
});

test("circular alias chains are rejected", () => {
  const { errors } = validateTokenTree({
    color: {
      $type: "color",
      a: { $value: "{color.b}" },
      b: { $value: "{color.a}" },
    },
  });
  assert.ok(errors.some((e) => e.includes("circular alias chain")));
});

test("concrete values must match their DTCG type", () => {
  const { errors } = validateTokenTree({
    color: { bad: { $type: "color", $value: "#ff0000" } },
    space: { bad: { $type: "dimension", $value: { value: 8, unit: "em" } } },
    font: { weight: { bad: { $type: "fontWeight", $value: 1200 } } },
  });
  assert.equal(errors.length, 3);
});

test("merging rejects the same top-level group from two files", () => {
  const { errors } = mergeTokenTrees(
    new Map([
      ["color.tokens.json", { color: { red: RED } }],
      ["extra.tokens.json", { color: { blue: RED } }],
    ]),
  );
  assert.ok(
    errors.some((e) =>
      e.includes('top-level group "color" is declared by both'),
    ),
  );
});

test("only whole-value braces parse as aliases", () => {
  assert.equal(parseAlias("{color.primary.70}"), "color.primary.70");
  assert.equal(parseAlias("solid {color.primary.70}"), null);
  assert.equal(parseAlias(8), null);
});
