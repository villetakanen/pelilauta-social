/**
 * Deterministic projection from validated DTCG tokens to the public
 * `--cn-*` CSS custom-property namespace (ADR 0001). Consumes the flat
 * token map produced by `dtcg.mjs`; every canonical path maps one-to-one
 * to one generated property, and unsupported input fails explicitly.
 *
 * Supported projection scope:
 * - Names: `--cn-` plus the canonical path segments joined with hyphens.
 *   Two paths projecting to the same name are a collision error.
 * - Values: `color` (oklch and srgb color spaces), `dimension`, `number`,
 *   `fontFamily`, and `fontWeight` (keywords project to their DTCG
 *   numeric equivalents).
 * - Whole-value aliases project to `var(--cn-*)` references and must
 *   resolve to a target of the same type.
 *
 * Rejected, not ignored: other color spaces and aliases embedded inside
 * composite values, which have no faithful CSS representation here.
 */

import { parseAlias } from "./dtcg.mjs";

export function cssName(path) {
  return `--cn-${path.split(".").join("-")}`;
}

const FONT_WEIGHT_NUMBERS = new Map([
  ["thin", 100],
  ["hairline", 100],
  ["extra-light", 200],
  ["ultra-light", 200],
  ["light", 300],
  ["normal", 400],
  ["regular", 400],
  ["book", 400],
  ["medium", 500],
  ["semi-bold", 600],
  ["demi-bold", 600],
  ["bold", 700],
  ["extra-bold", 800],
  ["ultra-bold", 800],
  ["black", 900],
  ["heavy", 900],
  ["extra-black", 950],
  ["ultra-black", 950],
]);

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

function quoteCssString(value) {
  let result = '"';
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (character === '"' || character === "\\") {
      result += `\\${character}`;
    } else if (codePoint <= 0x1f || codePoint === 0x7f) {
      result += `\\${codePoint.toString(16)} `;
    } else {
      result += character;
    }
  }
  return `${result}"`;
}

function serializeColor(path, value, errors) {
  const components = value.components.map((c) =>
    c === "none" ? "none" : String(c),
  );
  const alpha = "alpha" in value ? ` / ${value.alpha}` : "";
  switch (value.colorSpace) {
    case "oklch":
      return `oklch(${components.join(" ")}${alpha})`;
    case "srgb":
      return `color(srgb ${components.join(" ")}${alpha})`;
    default:
      errors.push(
        `token "${path}" uses colorSpace "${value.colorSpace}", which has no CSS projection`,
      );
      return null;
  }
}

function serializeFontFamily(value) {
  const families = Array.isArray(value) ? value : [value];
  return families
    .map((family) =>
      GENERIC_FAMILIES.has(family) ? family : quoteCssString(family),
    )
    .join(", ");
}

function serializeValue(path, token, tokens, errors) {
  const alias = parseAlias(token.value);
  if (alias !== null) {
    const target = tokens.get(alias);
    if (target === undefined) {
      errors.push(`token "${path}" references unknown token "{${alias}}"`);
      return null;
    }
    if (target.type !== token.type) {
      errors.push(
        `token "${path}" ($type "${token.type}") aliases "${alias}" of different $type "${target.type}"`,
      );
      return null;
    }
    return `var(${cssName(alias)})`;
  }
  if (token.refs.length > 0) {
    errors.push(
      `token "${path}" embeds aliases inside a composite value, which has no CSS projection`,
    );
    return null;
  }

  switch (token.type) {
    case "color":
      return serializeColor(path, token.value, errors);
    case "dimension":
      return `${token.value.value}${token.value.unit}`;
    case "number":
      return String(token.value);
    case "fontFamily":
      return serializeFontFamily(token.value);
    case "fontWeight":
      return typeof token.value === "number"
        ? String(token.value)
        : String(FONT_WEIGHT_NUMBERS.get(token.value));
    default:
      errors.push(
        `token "${path}" has $type "${token.type}" with no CSS projection`,
      );
      return null;
  }
}

/**
 * Project the flat token map to CSS declarations in document order.
 * Returns collected error strings and `{ path, name, value }` entries.
 */
export function projectTokens(tokens) {
  const errors = [];
  const declarations = [];
  const pathsByName = new Map();

  for (const [path, token] of tokens) {
    const name = cssName(path);
    if (pathsByName.has(name)) {
      errors.push(
        `tokens "${pathsByName.get(name)}" and "${path}" both project to "${name}"`,
      );
      continue;
    }
    pathsByName.set(name, path);
    const value = serializeValue(path, token, tokens, errors);
    if (value !== null) declarations.push({ path, name, value });
  }

  return { errors, declarations };
}

/**
 * Render the committed web representation. Output is byte-deterministic
 * for a given token source so freshness checks can compare exact text.
 */
export function renderCss(declarations) {
  return [
    "/* Generated from tokens/*.tokens.json by scripts/generate-css.mjs.",
    " * Do not edit; run `pnpm --filter @pelilauta/design-system generate`. */",
    ":root {",
    ...declarations.map(({ name, value }) => `  ${name}: ${value};`),
    "}",
    "",
  ].join("\n");
}
