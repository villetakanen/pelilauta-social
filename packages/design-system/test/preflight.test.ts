/**
 * Contract tests for the document preflight.
 *
 * The spec says the rule set is closed, and prose cannot settle whether
 * `optgroup` or a WebKit search pseudo-element is inside it — so the literal
 * selector list lives here. A rule added to the stylesheet fails this test until
 * the spec has been changed and the list follows it.
 *
 * Spec: specs/design-system/preflight/spec.md
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const preflight = read('../styles/preflight.css');

/** Source with comments removed, so commented-out examples never count as rules. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Selectors of every rule in a stylesheet, in source order. */
function selectors(source: string): string[] {
  const found: string[] = [];
  const rule = /(^|[};])\s*([^{}@]+?)\s*\{/g;
  let match = rule.exec(source);
  while (match !== null) {
    found.push(match[2].replace(/\s+/g, ' ').trim());
    match = rule.exec(source);
  }
  return found;
}

/**
 * The closed set, grouped as the spec groups it. Selector lists are compared as
 * written, so reordering one is a deliberate edit here too.
 */
const EXPECTED = [
  // 1. Box model
  '*, ::before, ::after',
  // 2. Document
  ':root',
  'html',
  // 3. Inheritance
  'button, input, optgroup, select, textarea',
  'button, select',
  'button, [role="button"]',
  'button, [type="button"], [type="reset"], [type="submit"]',
  'textarea',
  '::-moz-focus-inner',
  ':-moz-focusring',
  ':-moz-ui-invalid',
  '::-webkit-inner-spin-button, ::-webkit-outer-spin-button',
  '[type="search"]',
  '::-webkit-search-decoration',
  // 4. Element defaults
  'hr',
  'abbr[title]',
  'b, strong',
  'small',
  'sub, sup',
  'sub',
  'sup',
  'code, kbd, samp, pre',
  'summary',
  'table',
  '[hidden]',
  'ol, ul, menu',
  '[popover]',
  // 5. Body and framework
  'body',
  'astro-island',
];

describe('preflight', () => {
  test('contains exactly the rules the spec describes', () => {
    expect(selectors(withoutComments(preflight))).toEqual(EXPECTED);
  });

  test('declares no custom property', () => {
    const declarations =
      withoutComments(preflight).match(/--[\w-]+\s*:/g) ?? [];
    expect(declarations).toEqual([]);
  });

  test('sets no font-size on the document root', () => {
    // The reader's root size is the origin of every length in the system, and
    // this is the one stylesheet where overriding it would look natural.
    const rootRules = withoutComments(preflight).match(
      /(^|[};])\s*(:root|html)\s*\{[^}]*\}/g,
    );
    expect(rootRules).not.toBeNull();
    for (const rule of rootRules ?? []) {
      expect(rule).not.toMatch(/font-size\s*:/);
    }
  });

  test('every custom property it reads is defined by the design system', () => {
    const theme = read('../styles/color-theme.css');
    const read_ = withoutComments(preflight).matchAll(
      /var\(\s*(--[\w-]+)\s*(,)?/g,
    );
    for (const [, name, hasFallback] of read_) {
      // A name the design system does not own yet may be read with a fallback;
      // --cn-font-family-mono belongs to typography, which is still Cyan's.
      if (hasFallback) continue;
      expect(theme, `${name} is read without a fallback`).toContain(`${name}:`);
    }
  });

  test('is the only design-system stylesheet declaring color-scheme', () => {
    const others = [
      '../styles/color-theme.css',
      '../styles/color.css',
      '../styles/units.css',
      '../styles/icon.css',
      '../styles/docs.css',
      '../styles/compat/cyan-4.css',
    ];
    expect(withoutComments(preflight)).toMatch(/color-scheme\s*:/);
    for (const path of others) {
      expect(withoutComments(read(path)), path).not.toMatch(/color-scheme\s*:/);
    }
  });
});

describe('entry point', () => {
  test('composes the preflight and the tokens, in that order', () => {
    const entry = withoutComments(read('../styles/ds.css'));
    const imports = [...entry.matchAll(/@import\s+"([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(imports).toEqual(['./preflight.css', './tokens.css']);
  });

  test('leaves the token entry point usable without a reset', () => {
    const tokens = withoutComments(read('../styles/tokens.css'));
    expect(tokens).not.toContain('preflight');
  });
});
