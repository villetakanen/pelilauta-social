/**
 * Unit tests for the TokenTable specimen's parser.
 *
 * Every defect a lexicon parser can have is silent — a dropped declaration
 * renders a shorter table, and nothing fails. Two such defects shipped in the
 * preflight book's parser before being caught by reading its output: a slice
 * that stopped at the first inline comment, and a pattern that consumed the
 * closing brace and so dropped every second consecutive rule. Those two cases
 * are asserted here by name.
 *
 * The specimen renders static markup from a build-time parse and runs no client
 * script, so there is nothing here a browser would know that this does not.
 * Cascade facts belong in the design-site checks; this is a source fact.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parseTokens } from '../books/specimens/tokenTable';

const unitsSource = readFileSync(
  new URL('../styles/units.css', import.meta.url),
  'utf8',
);

describe('parseTokens', () => {
  test('returns every declaration in source order, and none invented', () => {
    const tokens = parseTokens(`:root {
      --a: 1rem;
      --b: 2rem;
      --c: 3rem;
    }`);

    expect(tokens.map((token) => token.name)).toEqual(['--a', '--b', '--c']);
    expect(tokens.map((token) => token.value)).toEqual([
      '1rem',
      '2rem',
      '3rem',
    ]);
  });

  test('an inline comment does not truncate the parse', () => {
    // The preflight parser stopped here, returning only what preceded the
    // first comment.
    const tokens = parseTokens(`:root {
      --a: 1rem; /* 16px */
      --b: 2rem; /* 32px */
      --c: 3rem;
    }`);

    expect(tokens.map((token) => token.name)).toEqual(['--a', '--b', '--c']);
  });

  test('consecutive declarations are not dropped', () => {
    // The other preflight defect: a pattern that consumed one declaration's
    // terminator kept every other one.
    const tokens = parseTokens(
      ':root{--a:1rem;--b:2rem;--c:3rem;--d:4rem;--e:5rem;}',
    );

    expect(tokens).toHaveLength(5);
  });

  test('a trailing comment is captured as the declaration note', () => {
    const [token] = parseTokens('--a: 0.5rem; /* 8px at the default root */');

    expect(token.note).toBe('8px at the default root');
  });

  test('a comment on its own line annotates nothing', () => {
    // It introduces what follows; attaching it to the previous declaration
    // would print an unrelated sentence beside a value.
    const tokens = parseTokens(`:root {
      --a: 1rem;
      /* The default, for a consumer that does not choose. */
      --b: var(--a);
    }`);

    expect(tokens[0].note).toBeUndefined();
    expect(tokens[1].note).toBeUndefined();
  });

  test('a property named in prose is not parsed as a declaration', () => {
    // Stylesheet headers in this package discuss their own tokens, so the
    // parser must read the stylesheet rather than the commentary about it.
    const tokens = parseTokens(`/*
      Historical note: --cn-legacy: 4px; was removed in v20.
    */
    :root {
      --cn-grid: 0.5rem;
    }`);

    expect(tokens.map((token) => token.name)).toEqual(['--cn-grid']);
  });

  test('var() and calc() values survive whitespace normalization', () => {
    const tokens = parseTokens(`:root {
      --a: calc(var(--cn-grid)
        * 2);
    }`);

    expect(tokens[0].value).toBe('calc(var(--cn-grid) * 2)');
  });

  test('an unterminated comment does not swallow later declarations silently', () => {
    // It swallows them the way a browser does — the point is that the parser
    // agrees with the browser rather than disagreeing quietly.
    const tokens = parseTokens(':root { --a: 1rem; /* unterminated --b: 2rem;');

    expect(tokens.map((token) => token.name)).toEqual(['--a']);
  });

  test('a filter that matches nothing returns nothing, not everything', () => {
    // The failure this prevents: a renamed token quietly turning a filtered
    // table into a dump of every token in the stylesheet.
    expect(parseTokens(unitsSource, { names: ['--not-a-token'] })).toEqual([]);
    expect(parseTokens(unitsSource, { prefix: '--not-a-prefix' })).toEqual([]);
  });

  test('without drops matching declarations after the include filter', () => {
    const css = ':root{--a-x:1;--a-shadow-y:2;--a-z:3;}';

    expect(
      parseTokens(css, { prefix: '--a', without: 'shadow' }).map((t) => t.name),
    ).toEqual(['--a-x', '--a-z']);
  });

  test('a prefix and its without-complement cover the file between them', () => {
    // The property that makes a split table safe: two calls, no token in both,
    // none missed. A lexicon that splits a stylesheet depends on this.
    const css = ':root{--a-x:1;--a-shadow-y:2;--a-z:3;--a-shadow-w:4;}';
    const kept = parseTokens(css, { prefix: '--a', without: 'shadow' });
    const dropped = parseTokens(css, { prefix: '--a-shadow' });
    const all = parseTokens(css);

    expect(kept.length + dropped.length).toBe(all.length);
    expect(new Set([...kept, ...dropped].map((t) => t.name))).toEqual(
      new Set(all.map((t) => t.name)),
    );
  });

  test('a filter selects a subset, in the stylesheet order rather than its own', () => {
    const tokens = parseTokens(unitsSource, {
      names: ['--cn-line', '--cn-grid'],
    });

    expect(tokens.map((token) => token.name)).toEqual([
      '--cn-grid',
      '--cn-line',
    ]);
  });
});

describe('against the production units.css', () => {
  test('the book cannot miss a token the stylesheet declares', () => {
    // The lexicon shows spacing, radii, control geometry and breakpoints, which
    // is every declaration in the file. If a family is added, this fails until
    // the book accounts for it.
    const all = parseTokens(unitsSource).map((token) => token.name);
    const shown = [
      ...parseTokens(unitsSource, {
        names: ['--cn-grid', '--cn-gap', '--cn-line'],
      }),
      ...parseTokens(unitsSource, { prefix: '--cn-border-radius' }),
      ...parseTokens(unitsSource, { prefix: '--cn-button' }),
      ...parseTokens(unitsSource, { prefix: '--cn-icon-size' }),
      ...parseTokens(unitsSource, { prefix: '--cn-duration' }),
      ...parseTokens(unitsSource, { prefix: '--cn-easing' }),
      ...parseTokens(unitsSource, { prefix: '--cn-breakpoint' }),
    ].map((token) => token.name);

    expect(new Set(shown)).toEqual(new Set(all));
  });
});
