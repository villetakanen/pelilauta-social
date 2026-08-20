/**
 * The theme and the host stylesheet are the two places this package writes
 * CSS. Both use the design system's semantic tokens, plus the package's
 * private custom properties — never a raw palette token (`--color-*`),
 * never a chroma token, and never the input field's custom properties
 * (`--cn-input*`), which v20 used and this package deliberately does not.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const editorTheme = readFileSync(join(packageRoot, 'editorTheme.ts'), 'utf8');
const editorCss = readFileSync(
  join(packageRoot, 'styles', 'editor.css'),
  'utf8',
);

const CUSTOM_PROPERTY = /--[A-Za-z0-9_-]+/g;

/**
 * Every --cn-* declaration in the design system's stylesheets. A token that
 * is spelled like a semantic token but declared nowhere passes the naming
 * checks below and still renders as nothing — the selection background
 * shipped that way once, lifted from v20's token set.
 */
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

/**
 * Both files carry block comments — TSDoc in editorTheme.ts, CSS comments in
 * editor.css — that name tokens in prose (`--_field-indicator-width`, the
 * property this package's private property restates). Stripped first, so the
 * check reads only the properties the code actually declares or references.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function customProperties(source: string): string[] {
  return stripComments(source).match(CUSTOM_PROPERTY) ?? [];
}

describe.each([
  ['editorTheme.ts', editorTheme],
  ['styles/editor.css', editorCss],
])('%s', (_name, source) => {
  const properties = customProperties(source);

  test('references at least one custom property', () => {
    expect(properties.length).toBeGreaterThan(0);
  });

  test('every custom property is --cn-* or --_editor-*', () => {
    const outliers = properties.filter(
      (name) => !name.startsWith('--cn-') && !name.startsWith('--_editor-'),
    );
    expect(outliers).toEqual([]);
  });

  test('every --cn-* token is declared in the design system', () => {
    const undeclared = properties.filter(
      (name) => name.startsWith('--cn-') && !designSystemDeclarations.has(name),
    );
    expect(undeclared).toEqual([]);
  });

  test('carries no --color-*, --chroma-* or --cn-input* token', () => {
    expect(properties.filter((name) => name.startsWith('--color-'))).toEqual(
      [],
    );
    expect(properties.filter((name) => name.startsWith('--chroma-'))).toEqual(
      [],
    );
    expect(properties.filter((name) => name.startsWith('--cn-input'))).toEqual(
      [],
    );
  });
});
