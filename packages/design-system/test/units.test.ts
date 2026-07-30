/**
 * Parity tests for the unit and radius tokens.
 *
 * These tokens are forward-ported from v20 at values Cyan 4 already computes, so
 * that both sources may coexist while legacy consumers migrate. That claim is
 * only true while it stays true, so it is asserted here against the installed
 * cyan-css rather than trusted.
 *
 *   node --experimental-strip-types --test test/units.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (path: string) => readFileSync(path, 'utf8');

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));

/**
 * Installed dependencies live in the package's own node_modules or, under
 * node-linker=hoisted, only in the workspace root. Throw with both candidates
 * rather than returning nothing, which would let this test pass while comparing
 * against no installed source at all.
 */
function installed(relative: string): string {
  const candidates = [
    join(packageRoot, 'node_modules', relative),
    join(workspaceRoot, 'node_modules', relative),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      `Installed source not found for '${relative}'. Looked in:\n  ${candidates.join('\n  ')}`,
    );
  }
  return found;
}

/** Custom-property declarations of a stylesheet, as name -> value. */
function declarations(source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    found.set(name, value.replace(/\s+/g, ' ').trim());
  }
  return found;
}

/** Resolve a var()/calc() chain to a rem number, so two spellings can be compared. */
function toRem(name: string, tokens: Map<string, string>): number {
  const seen = new Set<string>();
  const evaluate = (expression: string): number => {
    const trimmed = expression.trim();

    const variable = trimmed.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/);
    if (variable) {
      const target = variable[1];
      assert.ok(!seen.has(target), `cycle resolving ${target}`);
      seen.add(target);
      const next = tokens.get(target);
      assert.ok(next !== undefined, `${target} is not defined`);
      return evaluate(next);
    }

    const calc = trimmed.match(/^calc\((.+)\)$/);
    if (calc) {
      const [left, operator, right] = calc[1]
        .split(/\s*([*/])\s*/)
        .map((part) => part.trim());
      const a = evaluate(left);
      const b = Number(right);
      assert.ok(!Number.isNaN(b), `unsupported operand in ${trimmed}`);
      return operator === '/' ? a / b : a * b;
    }

    const rem = trimmed.match(/^(-?[\d.]+)rem$/);
    assert.ok(rem, `unsupported value: ${trimmed}`);
    return Number(rem[1]);
  };

  const declaration = tokens.get(name);
  assert.ok(declaration !== undefined, `${name} is not defined`);
  return evaluate(declaration);
}

const ours = declarations(
  read(new URL('../styles/units.css', import.meta.url).pathname),
);

const cyan = declarations(
  read(installed('@11thdeg/cyan-css/dist/tokens/units.css')),
);

const PORTED = [
  '--cn-grid',
  '--cn-gap',
  '--cn-line',
  '--cn-border-radius-small',
  '--cn-border-radius-medium',
  '--cn-border-radius-large',
  '--cn-border-radius-xl',
];

test('every ported token computes to the value Cyan 4 computes', () => {
  for (const name of PORTED) {
    assert.equal(
      toRem(name, ours),
      toRem(name, cyan),
      `${name} diverged from Cyan 4`,
    );
  }
});

test('the grid is the documented 8px and the scale derives from it', () => {
  const grid = toRem('--cn-grid', ours);
  assert.equal(grid, 0.5);
  assert.equal(toRem('--cn-gap', ours), grid * 2);
  assert.equal(toRem('--cn-line', ours), grid * 3);
  assert.equal(toRem('--cn-border-radius-small', ours), grid * 0.5);
  assert.equal(toRem('--cn-border-radius-large', ours), grid * 2);
  assert.equal(toRem('--cn-border-radius-xl', ours), grid * 4);
});

test('the default radius is medium', () => {
  assert.equal(
    toRem('--cn-border-radius', ours),
    toRem('--cn-border-radius-medium', ours),
  );
});

test('the elevation shadows can resolve, which needs --cn-grid', () => {
  const theme = declarations(
    read(new URL('../styles/color-theme.css', import.meta.url).pathname),
  );

  // color-theme.css derives its shadows from --cn-grid but does not define it.
  // tokens.css exists to guarantee the pairing; assert the dependency is real
  // and that this file satisfies it.
  const shadow = theme.get('--cn-shadow-elevation-3');
  assert.ok(
    shadow?.includes('var(--cn-grid)'),
    'shadows should derive from the grid',
  );
  assert.equal(theme.has('--cn-grid'), false, 'the grid is units.css to own');
  assert.ok(ours.has('--cn-grid'), 'units.css must define the grid');

  const entry = read(new URL('../styles/tokens.css', import.meta.url).pathname);
  assert.match(entry, /units\.css/);
  assert.match(entry, /color\.css/);
});
