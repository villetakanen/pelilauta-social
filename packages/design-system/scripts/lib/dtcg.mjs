/**
 * Dependency-free conformance checks for the canonical DTCG 2025.10 token
 * source under `tokens/`. This module owns the supported input scope; the
 * deterministic `--cn-*` projection builds on it in a later issue.
 *
 * Supported scope (DTCG 2025.10 Format + Color):
 * - Plain-object token trees from `*.tokens.json` files.
 * - Group/token properties `$type`, `$value`, `$description`, `$extensions`,
 *   and `$deprecated`. `$extensions` content is preserved but not interpreted.
 * - `$type` values `color`, `dimension`, `fontFamily`, `fontWeight`, and
 *   `number` (the reference-token scope). Group-level `$type` inheritance.
 * - Whole-value aliases of the form `{path.to.token}`, including inside
 *   array or object values.
 *
 * Unsupported inputs are rejected, not ignored:
 * - Any other `$`-prefixed property or `$type` value.
 * - Partial string interpolation of aliases, unresolved or circular aliases.
 * - Resolver documents, themes, and modes.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const SUPPORTED_TYPES = new Set([
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "number",
]);

const TOKEN_PROPERTIES = new Set([
  "$type",
  "$value",
  "$description",
  "$extensions",
  "$deprecated",
]);
const GROUP_PROPERTIES = new Set([
  "$type",
  "$description",
  "$extensions",
  "$deprecated",
]);

const ALIAS_PATTERN = /^\{([^{}]+)\}$/;
const DIMENSION_UNITS = new Set(["px", "rem"]);
const FONT_WEIGHT_KEYWORDS = new Set([
  "thin",
  "hairline",
  "extra-light",
  "ultra-light",
  "light",
  "normal",
  "regular",
  "book",
  "medium",
  "semi-bold",
  "demi-bold",
  "bold",
  "extra-bold",
  "ultra-bold",
  "black",
  "heavy",
  "extra-black",
  "ultra-black",
]);

function isPlainObject(value) {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

function isToken(node) {
  return isPlainObject(node) && "$value" in node;
}

export function parseAlias(value) {
  if (typeof value !== "string") return null;
  const match = ALIAS_PATTERN.exec(value);
  return match ? match[1] : null;
}

function collectAliasReferences(value, refs) {
  const alias = parseAlias(value);
  if (alias !== null) {
    refs.push(alias);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAliasReferences(item, refs);
  } else if (isPlainObject(value)) {
    for (const item of Object.values(value)) {
      collectAliasReferences(item, refs);
    }
  }
}

function validateName(name, parentPath, errors) {
  const where = parentPath.length ? parentPath.join(".") : "(root)";
  if (name.length === 0) {
    errors.push(`empty token or group name under "${where}"`);
    return false;
  }
  if (/[{}.]/.test(name)) {
    errors.push(
      `name "${name}" under "${where}" must not contain "{", "}", or "."`,
    );
    return false;
  }
  return true;
}

function validateConcreteValue(path, type, value, errors) {
  switch (type) {
    case "color": {
      if (
        !isPlainObject(value) ||
        typeof value.colorSpace !== "string" ||
        !Array.isArray(value.components)
      ) {
        errors.push(
          `token "${path}" of $type "color" needs an object $value with "colorSpace" and "components"`,
        );
        return;
      }
      const componentsValid = value.components.every(
        (c) => typeof c === "number" || c === "none",
      );
      if (!componentsValid) {
        errors.push(
          `token "${path}" has color components that are not numbers or "none"`,
        );
      }
      if ("alpha" in value && typeof value.alpha !== "number") {
        errors.push(`token "${path}" has a non-numeric color alpha`);
      }
      return;
    }
    case "dimension": {
      if (
        !isPlainObject(value) ||
        typeof value.value !== "number" ||
        !DIMENSION_UNITS.has(value.unit)
      ) {
        errors.push(
          `token "${path}" of $type "dimension" needs an object $value with numeric "value" and "unit" of "px" or "rem"`,
        );
      }
      return;
    }
    case "number": {
      if (typeof value !== "number") {
        errors.push(`token "${path}" of $type "number" needs a numeric $value`);
      }
      return;
    }
    case "fontFamily": {
      const valid =
        typeof value === "string" ||
        (Array.isArray(value) &&
          value.length > 0 &&
          value.every((f) => typeof f === "string"));
      if (!valid) {
        errors.push(
          `token "${path}" of $type "fontFamily" needs a string or string-array $value`,
        );
      }
      return;
    }
    case "fontWeight": {
      const valid =
        (typeof value === "number" && value >= 1 && value <= 1000) ||
        (typeof value === "string" && FONT_WEIGHT_KEYWORDS.has(value));
      if (!valid) {
        errors.push(
          `token "${path}" of $type "fontWeight" needs a number in 1-1000 or a DTCG weight keyword`,
        );
      }
      return;
    }
    default:
      errors.push(`token "${path}" has unsupported $type "${type}"`);
  }
}

function walk(node, path, inheritedType, tokens, errors) {
  const isTokenNode = isToken(node);
  const allowed = isTokenNode ? TOKEN_PROPERTIES : GROUP_PROPERTIES;

  for (const key of Object.keys(node)) {
    if (key.startsWith("$")) {
      if (!allowed.has(key)) {
        const where = path.length ? path.join(".") : "(root)";
        errors.push(`unsupported property "${key}" at "${where}"`);
      }
      continue;
    }
    if (isTokenNode) {
      errors.push(
        `token "${path.join(".")}" must not contain child node "${key}"`,
      );
      continue;
    }
    if (!validateName(key, path, errors)) continue;
    const child = node[key];
    if (!isPlainObject(child)) {
      errors.push(
        `"${[...path, key].join(".")}" must be a token or group object`,
      );
      continue;
    }
    walk(child, [...path, key], node.$type ?? inheritedType, tokens, errors);
  }

  if (!isTokenNode) return;

  const pathName = path.join(".");
  const type = node.$type ?? inheritedType;
  if (type === undefined) {
    errors.push(`token "${pathName}" has no explicit or inherited $type`);
  } else if (typeof type !== "string" || !SUPPORTED_TYPES.has(type)) {
    errors.push(`token "${pathName}" has unsupported $type "${type}"`);
  }

  const refs = [];
  collectAliasReferences(node.$value, refs);
  tokens.set(pathName, { type, value: node.$value, refs });

  if (refs.length === 0 && typeof type === "string" && SUPPORTED_TYPES.has(type)) {
    validateConcreteValue(pathName, type, node.$value, errors);
  }
}

function checkAliasGraph(tokens, errors) {
  for (const [path, token] of tokens) {
    for (const ref of token.refs) {
      if (!tokens.has(ref)) {
        errors.push(`token "${path}" references unknown token "{${ref}}"`);
      }
    }
  }

  const visiting = new Set();
  const resolved = new Set();
  const visit = (path, trail) => {
    if (resolved.has(path)) return;
    if (visiting.has(path)) {
      errors.push(
        `circular alias chain: ${[...trail, path].join(" -> ")}`,
      );
      return;
    }
    visiting.add(path);
    const token = tokens.get(path);
    for (const ref of token?.refs ?? []) {
      if (tokens.has(ref)) visit(ref, [...trail, path]);
    }
    visiting.delete(path);
    resolved.add(path);
  };
  for (const path of tokens.keys()) visit(path, []);
}

/**
 * Validate one parsed token tree. Returns collected error strings and the
 * flat token map keyed by dot-joined canonical path.
 */
export function validateTokenTree(tree) {
  const errors = [];
  const tokens = new Map();
  if (!isPlainObject(tree)) {
    return { errors: ["token document root must be an object"], tokens };
  }
  walk(tree, [], undefined, tokens, errors);
  checkAliasGraph(tokens, errors);
  return { errors, tokens };
}

/**
 * Merge top-level groups from multiple files into one tree. Two files
 * declaring the same top-level name is a collision, so canonical paths
 * stay unique across the whole `tokens/` directory.
 */
export function mergeTokenTrees(trees) {
  const errors = [];
  const merged = {};
  const owners = new Map();
  for (const [file, tree] of trees) {
    if (!isPlainObject(tree)) {
      errors.push(`${file}: token document root must be an object`);
      continue;
    }
    for (const [key, value] of Object.entries(tree)) {
      if (key.startsWith("$")) continue;
      if (owners.has(key)) {
        errors.push(
          `top-level group "${key}" is declared by both ${owners.get(key)} and ${file}`,
        );
        continue;
      }
      owners.set(key, file);
      merged[key] = value;
    }
  }
  return { errors, merged };
}

/**
 * Load and validate every `*.tokens.json` file under the given directory.
 */
export function validateTokenDirectory(dir) {
  const errors = [];
  const trees = new Map();
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".tokens.json"))
    .sort();

  for (const file of files) {
    try {
      trees.set(file, JSON.parse(readFileSync(join(dir, file), "utf8")));
    } catch (cause) {
      errors.push(`${file}: invalid JSON (${cause.message})`);
    }
  }

  const mergeResult = mergeTokenTrees(trees);
  errors.push(...mergeResult.errors);
  const treeResult = validateTokenTree(mergeResult.merged);
  errors.push(...treeResult.errors);

  return { files, errors, tokens: treeResult.tokens };
}
