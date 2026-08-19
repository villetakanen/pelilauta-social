/**
 * Generates styles/chroma.css from tokens/themes/default.json and validates
 * the theme contract on the way. Run with --check to fail when the committed
 * stylesheet differs from its source instead of writing it.
 *
 * The theme contract (specs/design-system/color-system/spec.md):
 * - a core family carries the complete 13-step scale, an auxiliary family
 *   exactly the steps 20/40/60/90;
 * - every value is a literal oklch() whose lightness equals the step divided
 *   by one hundred, unless the theme declares a reasoned exception;
 * - emitted custom-property names are unique.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const themePath = join(packageRoot, 'tokens/themes/default.json');
const outputPath = join(packageRoot, 'styles/chroma.css');

const CORE_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
const AUXILIARY_STEPS = [20, 40, 60, 90];
const OKLCH = /^oklch\((\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+)\)$/;

const errors = [];
const theme = JSON.parse(readFileSync(themePath, 'utf8'));
const exceptions = theme.lightnessExceptions ?? {};

const declarations = new Map();
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
    if (declarations.has(name)) errors.push(`duplicate declaration ${name}`);
    declarations.set(name, value);
  }
}

if (errors.length > 0) {
  console.error(`tokens/themes/default.json violates the theme contract:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const sorted = [...declarations.entries()].sort(([a], [b]) =>
  a.localeCompare(b, 'en'),
);
const css = `/*
 * Generated from tokens/themes/default.json by scripts/generate-tokens.mjs.
 * Do not edit: change the JSON source and run \`pnpm generate:tokens\`.
 */
:root {
${sorted.map(([name, value]) => `  ${name}: ${value};`).join('\n')}
}
`;

if (process.argv.includes('--check')) {
  let committed = '';
  try {
    committed = readFileSync(outputPath, 'utf8');
  } catch {}
  if (committed !== css) {
    console.error(
      'styles/chroma.css differs from tokens/themes/default.json. ' +
        'The JSON is the writable source: edit it and run `pnpm generate:tokens`.',
    );
    process.exit(1);
  }
  console.log('chroma.css matches its token source.');
} else {
  writeFileSync(outputPath, css);
  console.log(`wrote ${sorted.length} chroma declarations to styles/chroma.css`);
}
