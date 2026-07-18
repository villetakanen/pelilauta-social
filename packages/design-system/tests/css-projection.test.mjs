import assert from "node:assert/strict";
import { test } from "node:test";
import { validateTokenTree } from "../scripts/lib/dtcg.mjs";
import {
  cssName,
  projectTokens,
  renderCss,
} from "../scripts/lib/projection.mjs";

function project(tree) {
  const source = validateTokenTree(tree);
  assert.deepEqual(source.errors, []);
  return projectTokens(source.tokens);
}

function declarationMap(tree) {
  const { errors, declarations } = project(tree);
  assert.deepEqual(errors, []);
  return new Map(declarations.map((d) => [d.name, d.value]));
}

test("canonical paths project to hyphen-joined --cn-* names", () => {
  assert.equal(cssName("color.primary.70"), "--cn-color-primary-70");
  assert.equal(cssName("space.grid"), "--cn-space-grid");
  assert.equal(cssName("line-height.body"), "--cn-line-height-body");
});

test("each supported type serializes to its CSS value", () => {
  const css = declarationMap({
    color: {
      $type: "color",
      primary: {
        "70": { $value: { colorSpace: "oklch", components: [0.7, 0.27, 135] } },
        translucent: {
          $value: { colorSpace: "srgb", components: [1, 0, 0], alpha: 0.5 },
        },
        faded: {
          $value: { colorSpace: "oklch", components: [0.7, "none", 135] },
        },
      },
    },
    space: { grid: { $type: "dimension", $value: { value: 0.5, unit: "rem" } } },
    "line-height": { body: { $type: "number", $value: 1.5 } },
    font: {
      family: {
        body: { $type: "fontFamily", $value: ["Open Sans", "Lato", "sans-serif"] },
        code: { $type: "fontFamily", $value: "monospace" },
      },
      weight: {
        bold: { $type: "fontWeight", $value: 700 },
        medium: { $type: "fontWeight", $value: "medium" },
      },
    },
  });
  assert.equal(css.get("--cn-color-primary-70"), "oklch(0.7 0.27 135)");
  assert.equal(css.get("--cn-color-primary-translucent"), "color(srgb 1 0 0 / 0.5)");
  assert.equal(css.get("--cn-color-primary-faded"), "oklch(0.7 none 135)");
  assert.equal(css.get("--cn-space-grid"), "0.5rem");
  assert.equal(css.get("--cn-line-height-body"), "1.5");
  assert.equal(css.get("--cn-font-family-body"), '"Open Sans", "Lato", sans-serif');
  assert.equal(css.get("--cn-font-family-code"), "monospace");
  assert.equal(css.get("--cn-font-weight-bold"), "700");
  assert.equal(css.get("--cn-font-weight-medium"), "500");
});

test("whole-value aliases project to var() references", () => {
  const css = declarationMap({
    space: {
      $type: "dimension",
      grid: { $value: { value: 8, unit: "px" } },
      gap: { $value: "{space.grid}" },
    },
  });
  assert.equal(css.get("--cn-space-gap"), "var(--cn-space-grid)");
});

test("font families quote CSS-wide keywords and escape controls", () => {
  const css = declarationMap({
    font: {
      family: {
        reserved: { $type: "fontFamily", $value: "initial" },
        control: { $type: "fontFamily", $value: "A\nB" },
        generic: { $type: "fontFamily", $value: "sans-serif" },
      },
    },
  });
  assert.equal(css.get("--cn-font-family-reserved"), '"initial"');
  assert.equal(css.get("--cn-font-family-control"), '"A\\a B"');
  assert.equal(css.get("--cn-font-family-generic"), "sans-serif");
});

test("aliases resolving to a different $type are rejected", () => {
  const { errors } = project({
    space: { grid: { $type: "dimension", $value: { value: 8, unit: "px" } } },
    "line-height": { body: { $type: "number", $value: "{space.grid}" } },
  });
  assert.ok(errors.some((e) => e.includes('different $type "dimension"')));
});

test("aliases inside composite values have no CSS projection", () => {
  const { errors } = project({
    font: {
      family: {
        brand: { $type: "fontFamily", $value: "Lato" },
        body: { $type: "fontFamily", $value: ["{font.family.brand}", "sans-serif"] },
      },
    },
  });
  assert.ok(errors.some((e) => e.includes("embeds aliases inside a composite value")));
});

test("unsupported color spaces are rejected, not ignored", () => {
  const { errors } = project({
    color: {
      odd: { $type: "color", $value: { colorSpace: "hsl", components: [1, 2, 3] } },
    },
  });
  assert.ok(errors.some((e) => e.includes('colorSpace "hsl"')));
});

test("two paths projecting to the same CSS name collide", () => {
  const { errors } = project({
    "line-height": { body: { $type: "number", $value: 1.5 } },
    line: { height: { body: { $type: "number", $value: 1.4 } } },
  });
  assert.ok(
    errors.some((e) => e.includes('both project to "--cn-line-height-body"')),
  );
});

test("rendered CSS is a single :root block in document order", () => {
  const { errors, declarations } = project({
    space: {
      $type: "dimension",
      grid: { $value: { value: 8, unit: "px" } },
      gap: { $value: "{space.grid}" },
    },
  });
  assert.deepEqual(errors, []);
  assert.equal(
    renderCss(declarations),
    [
      "/* Generated from tokens/*.tokens.json by scripts/generate-css.mjs.",
      " * Do not edit; run `pnpm --filter @pelilauta/design-system generate`. */",
      ":root {",
      "  --cn-space-grid: 8px;",
      "  --cn-space-gap: var(--cn-space-grid);",
      "}",
      "",
    ].join("\n"),
  );
});
