/**
 * Generates the committed token stylesheets from their JSON sources and
 * validates the token graph on the way. Run with --check to fail when a
 * committed stylesheet differs from its source instead of writing it.
 *
 * Sources and outputs:
 * - tokens/themes/default.json      → styles/chroma.css
 * - tokens/semantic-color.json      → styles/semantic.css
 * - tokens/elevation.json           → styles/elevation.css
 *
 * The theme contract (specs/design-system/color-system/spec.md):
 * - a core family carries the complete 13-step scale, an auxiliary family
 *   exactly the steps 20/40/60/90;
 * - every value is a literal oklch() whose lightness equals the step divided
 *   by one hundred, unless the theme declares a reasoned exception;
 * - emitted custom-property names are unique.
 *
 * The role contract (specs/design-system/design-tokens/spec.md):
 * - a role states one value, or a light and a dark arm emitted through
 *   light-dark();
 * - values reference other tokens symbolically — {chroma:family-step},
 *   {token:cn-name}, {unit:cn-name} — never as an embedded var();
 * - a semantic role depends only on chroma or another semantic role; an
 *   elevation role may also depend on units and other elevation roles;
 * - every reference resolves, and no chain forms a cycle.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = (relative) => join(packageRoot, relative);

const CORE_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
const AUXILIARY_STEPS = [20, 40, 60, 90];
const OKLCH = /^oklch\((\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+)\)$/;
const REFERENCE = /\{(chroma|token|unit):([\w-]+)\}/g;

const errors = [];

/* ----- theme → chroma ----- */

const theme = JSON.parse(readFileSync(path('tokens/themes/default.json'), 'utf8'));
const exceptions = theme.lightnessExceptions ?? {};

const chroma = new Map();
for (const [family, definition] of Object.entries(theme.families ?? {})) {
  const required =
    definition.kind === 'core'
      ? CORE_STEPS
      : definition.kind === 'auxiliary'
        ? AUXILIARY_STEPS
        : errors.push(`${family}: unknown kind '${definition.kind}'`) && [];
  const steps = Object.keys(definition.steps ?? {}).map(Number);

  for (const step of required)
    if (!steps.includes(step)) errors.push(`${family}: missing step ${step}`);
  for (const step of steps)
    if (!required.includes(step)) errors.push(`${family}: extra step ${step}`);

  for (const [step, value] of Object.entries(definition.steps ?? {})) {
    const match = OKLCH.exec(value);
    if (!match) {
      errors.push(`${family}-${step}: value '${value}' is not literal oklch()`);
      continue;
    }
    const lightness = Number(match[1]);
    const expected = Number(step) / 100;
    if (lightness !== expected && !exceptions[family]?.[step])
      errors.push(
        `${family}-${step}: lightness ${lightness} breaks the step index (expected ${expected}) and no exception is declared`,
      );
    const name = `--chroma-${family}-${step}`;
    if (chroma.has(name)) errors.push(`duplicate declaration ${name}`);
    chroma.set(name, value);
  }
}

/* ----- role sources → semantic and elevation ----- */

const semantic = JSON.parse(readFileSync(path('tokens/semantic-color.json'), 'utf8'));
const elevation = JSON.parse(readFileSync(path('tokens/elevation.json'), 'utf8'));

/** Custom properties units.css declares; the one layer still written by hand. */
const unitNames = new Set(
  [...readFileSync(path('styles/units.css'), 'utf8').matchAll(/(--[\w-]+)\s*:/g)].map(
    (match) => match[1],
  ),
);

const layers = [
  { source: 'tokens/semantic-color.json', tokens: semantic.tokens ?? {}, units: false },
  { source: 'tokens/elevation.json', tokens: elevation.tokens ?? {}, units: true },
];
const layerOf = new Map(); // token name → layer index
for (const [index, layer] of layers.entries()) {
  for (const name of Object.keys(layer.tokens)) {
    if (layerOf.has(name) || chroma.has(`--${name}`))
      errors.push(`duplicate declaration --${name}`);
    layerOf.set(name, index);
  }
}

/** The template strings a token states, with the arm they belong to. */
function statedValues(token, name) {
  if (typeof token.value === 'string') {
    if ('light' in token || 'dark' in token)
      errors.push(`${name}: states both a single value and a mode arm`);
    return [token.value];
  }
  if (typeof token.light === 'string' && typeof token.dark === 'string')
    return [token.light, token.dark];
  errors.push(`${name}: needs either a value or both a light and a dark arm`);
  return [];
}

for (const [index, layer] of layers.entries()) {
  for (const [name, token] of Object.entries(layer.tokens)) {
    for (const value of statedValues(token, name)) {
      if (value.includes('var('))
        errors.push(`${name}: embeds var(); reference tokens symbolically`);
      if (value.trim() === '') errors.push(`${name}: states an empty value`);
      // A brace the reference grammar did not consume is a typo'd kind or
      // malformed reference, and would ship as literal text in committed CSS.
      if (value.replace(REFERENCE, '').match(/[{}]/))
        errors.push(`${name}: contains a brace no {chroma:|token:|unit:} reference explains`);
      for (const [, kind, target] of value.matchAll(REFERENCE)) {
        if (kind === 'chroma' && !chroma.has(`--chroma-${target}`))
          errors.push(`${name}: references missing {chroma:${target}}`);
        if (kind === 'unit' && !layer.units)
          errors.push(`${name}: a semantic colour may not depend on a unit`);
        if (kind === 'unit' && layer.units && !unitNames.has(`--${target}`))
          errors.push(`${name}: references {unit:${target}} which units.css does not declare`);
        if (kind === 'token') {
          const targetLayer = layerOf.get(target);
          if (targetLayer === undefined)
            errors.push(`${name}: references missing {token:${target}}`);
          else if (targetLayer > index)
            errors.push(
              `${name}: ${layers[index].source} may not depend on ${layers[targetLayer].source}`,
            );
        }
      }
    }
  }
}

/* Cycle detection over {token:...} edges. */
{
  const all = Object.assign({}, ...layers.map((layer) => layer.tokens));
  const visiting = new Set();
  const done = new Set();
  const visit = (name, trail) => {
    if (done.has(name)) return;
    if (visiting.has(name)) {
      errors.push(`cycle: ${[...trail, name].join(' -> ')}`);
      return;
    }
    visiting.add(name);
    const token = all[name];
    const values =
      typeof token?.value === 'string' ? [token.value] : [token?.light, token?.dark];
    for (const value of values)
      for (const [, kind, target] of (value ?? '').matchAll(REFERENCE))
        if (kind === 'token' && target in all) visit(target, [...trail, name]);
    visiting.delete(name);
    done.add(name);
  };
  for (const name of Object.keys(all)) visit(name, []);
}

if (errors.length > 0) {
  console.error('the token sources violate their contract:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

/* ----- emission ----- */

const substitute = (value) =>
  value.replace(REFERENCE, (_, kind, target) =>
    kind === 'chroma' ? `var(--chroma-${target})` : `var(--${target})`,
  );

const header = (source) => `/*
 * Generated from ${source} by scripts/generate-tokens.mjs.
 * Do not edit: change the JSON source and run \`pnpm generate:tokens\`.
 */
`;

const sortedChroma = [...chroma.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'));
const chromaCss = `${header('tokens/themes/default.json')}:root {
${sortedChroma.map(([name, value]) => `  ${name}: ${value};`).join('\n')}
}
`;

function roleCss(source, tokens) {
  const lines = [];
  for (const [name, token] of Object.entries(tokens)) {
    if (token.comment) lines.push(`  /* ${token.comment} */`);
    const value =
      typeof token.value === 'string'
        ? substitute(token.value)
        : `light-dark(${substitute(token.light)}, ${substitute(token.dark)})`;
    lines.push(`  --${name}: ${value};`);
  }
  return `${header(source)}:root {
${lines.join('\n')}
}
`;
}

const outputs = [
  ['styles/chroma.css', chromaCss],
  ['styles/semantic.css', roleCss('tokens/semantic-color.json', semantic.tokens)],
  ['styles/elevation.css', roleCss('tokens/elevation.json', elevation.tokens)],
];

if (process.argv.includes('--check')) {
  let clean = true;
  for (const [relative, css] of outputs) {
    let committed = '';
    try {
      committed = readFileSync(path(relative), 'utf8');
    } catch {}
    if (committed !== css) {
      console.error(
        `${relative} differs from its token source. ` +
          'The JSON is the writable source: edit it and run `pnpm generate:tokens`.',
      );
      clean = false;
    }
  }
  if (!clean) process.exit(1);
  console.log('generated stylesheets match their token sources.');
} else {
  for (const [relative, css] of outputs) {
    writeFileSync(path(relative), css);
    console.log(`wrote ${relative}`);
  }
}
