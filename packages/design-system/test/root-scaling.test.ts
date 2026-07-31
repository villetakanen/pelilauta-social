/**
 * The design system scales with the reader, not around them.
 *
 * Every length in the system is relative to the document's root font size, so
 * the reader's browser preference is what the interface is built on. That holds
 * today only because nothing overrides it — an invisible property, easy to lose
 * to one well-meaning declaration, and impossible to notice without setting a
 * large default font and looking.
 *
 * The first two checks are green and near-vacuous on the current tree: the
 * package has one `@media` and no root font-size anywhere. They are regression
 * guards, not discoveries. They also see this package only, so a stray root
 * font-size in apps/pelilauta is out of reach and out of scope here.
 *
 * Spec: specs/design-system/design-tokens/spec.md
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const styles = new URL('../styles/', import.meta.url);

const read = (relativePath: string) =>
  stripComments(readFileSync(new URL(relativePath, styles), 'utf8'));

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every `--name: value` declaration, in source order. */
function declarations(css: string) {
  return [...css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+);/g)].map((match) => ({
    name: match[1],
    value: match[2].trim().replace(/\s+/g, ' '),
  }));
}

/**
 * Rule blocks as `[selectorList, body]`. At-rules are skipped, which is why the
 * media-query check below reads preludes separately.
 */
function ruleBlocks(css: string) {
  return [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1].split(',').map((selector) => selector.trim()),
    body: match[2],
  }));
}

const sheets = readdirSync(styles, { recursive: true, encoding: 'utf8' })
  .filter((name) => name.endsWith('.css'))
  .sort();

const units = read('units.css');

describe('the reader owns the root', () => {
  test('no stylesheet sets a font size on html or :root', () => {
    const offenders = sheets.flatMap((sheet) =>
      ruleBlocks(read(sheet))
        .filter((rule) =>
          rule.selectors.some((selector) => /^(html|:root)$/.test(selector)),
        )
        .filter((rule) => /(^|[;\s])font-size\s*:/.test(rule.body))
        .flatMap((rule) => rule.selectors.map((s) => `${sheet}: ${s}`)),
    );

    // Sizing the root replaces the reader's preference with a number of ours,
    // and every rem in the system is measured against it.
    expect(offenders).toEqual([]);
  });

  test('every media query is stated in relative units', () => {
    const offenders = sheets.flatMap((sheet) =>
      [...read(sheet).matchAll(/@media([^{]+)\{/g)]
        .map((match) => match[1].trim())
        .filter((prelude) => /\b\d*\.?\d+px\b/.test(prelude))
        .map((prelude) => `${sheet}: @media ${prelude}`),
    );

    // Scoped to the prelude on purpose: `1px solid` borders inside rule bodies
    // are not breakpoints. A px breakpoint cannot see that the reader asked for
    // larger text, so the type grows while the layout ignores it.
    expect(offenders).toEqual([]);
  });
});

describe('one origin', () => {
  test('the grid is the single literal, and it is relative', () => {
    const grid = declarations(units).find(
      (token) => token.name === '--cn-grid',
    );

    expect(grid?.value).toMatch(/^[\d.]+rem$/);
  });

  test('every other unit derives from the grid rather than restating a value', () => {
    const literal = declarations(units)
      .filter((token) => token.name !== '--cn-grid')
      .filter((token) => !token.value.includes('var(--cn-'))
      .map((token) => `${token.name}: ${token.value}`);

    // A pasted-in literal is how a scale quietly stops being one scale.
    expect(literal).toEqual([]);
  });

  test('units.css states no absolute length', () => {
    const absolute = declarations(units)
      .filter((token) => /\d+px\b/.test(token.value))
      .map((token) => `${token.name}: ${token.value}`);

    // stripComments has already removed the `/* 8px */` annotations, so a hit
    // here is a real declaration.
    expect(absolute).toEqual([]);
  });
});
