/**
 * Verifies that clock styles reference only declared design-system tokens and
 * required `--cn-*` custom properties.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const clockCss = readFileSync(join(packageRoot, 'styles', 'clock.css'), 'utf8');
const clockComponent = readFileSync(
  join(packageRoot, 'CnClock.svelte'),
  'utf8',
);

const CUSTOM_PROPERTY = /--[A-Za-z0-9_-]+/g;

const designSystemStyles = join(packageRoot, '..', 'design-system', 'styles');

function declaredTokens(dir: string): Set<string> {
  const declarations = new Set<string>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const token of declaredTokens(path)) declarations.add(token);
    } else if (entry.name.endsWith('.css')) {
      const source = readFileSync(path, 'utf8');
      for (const match of source.matchAll(/(--cn-[A-Za-z0-9_-]+)\s*:/g)) {
        declarations.add(match[1]);
      }
    }
  }
  return declarations;
}

const designSystemDeclarations = declaredTokens(designSystemStyles);

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function customProperties(source: string): string[] {
  return stripComments(source).match(CUSTOM_PROPERTY) ?? [];
}

describe.each([
  ['styles/clock.css', clockCss],
  ['CnClock.svelte', clockComponent],
])('%s', (_name, source) => {
  const properties = customProperties(source);

  test('every --cn-* token is declared in the design system', () => {
    const undeclared = properties.filter(
      (name) => name.startsWith('--cn-') && !designSystemDeclarations.has(name),
    );
    expect(undeclared).toEqual([]);
  });

  test('every custom property is --cn-* or package-private', () => {
    const outliers = properties.filter(
      (name) => !name.startsWith('--cn-') && !name.startsWith('--_clock-'),
    );
    expect(outliers).toEqual([]);
  });

  test('carries no --color-* or --chroma-* token', () => {
    expect(properties.filter((name) => name.startsWith('--color-'))).toEqual(
      [],
    );
    expect(properties.filter((name) => name.startsWith('--chroma-'))).toEqual(
      [],
    );
  });
});

test('the stylesheet references at least one custom property', () => {
  expect(customProperties(clockCss).length).toBeGreaterThan(0);
});

test('the spec-named tokens are all referenced: surface, info, the field-border family, focus-ring', () => {
  for (const token of [
    '--cn-color-surface',
    '--cn-color-info',
    '--cn-color-field-border',
    '--cn-color-field-border-hover',
    '--cn-color-field-border-focus',
    '--cn-color-focus-ring',
  ]) {
    expect(clockCss).toContain(`var(${token})`);
  }
});
