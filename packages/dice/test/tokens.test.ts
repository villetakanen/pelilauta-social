/**
 * Token hygiene for Dice.
 *
 * Every other design-system extension is forbidden from touching
 * `--chroma-*` directly (see `packages/editor/test/tokens.test.ts`): a
 * consumer takes the semantic layer's roles, never the palette underneath
 * them. `specs/dice/spec.md` names Dice the one deliberate exception — "a
 * decorative, extension-private direct-chroma consumer" — because a die's
 * colour identifies its side count rather than carrying a themeable role.
 *
 * So this suite does not forbid `--chroma-*` outright. It permits exactly
 * the two `--chroma-warning-*` steps the seven-die mix uses as its
 * endpoints — a trial, at the operator's request, of one bespoke colour per
 * die rather than four steps shared across pairs (the operator's ruling:
 * mix along the warning scale between `--chroma-warning-90` and
 * `--chroma-warning-40`, equidistant in lightness — see `styles/dice.css`'s
 * colour-ramp comment), forbids every other chroma step and family, and
 * otherwise holds the same line the editor's suite does: a custom property
 * is `--_dice-*` (package-private) or nothing at all.
 *
 * Two `--cn-*` semantic tokens are a further deliberate exception: `--cn-line`
 * sizes the die box to a line's height (the ported `cn-dice`'s governing
 * intent), and `--cn-font-size-text` sizes the glyph to surrounding prose.
 * Both are read-only consumption of the semantic layer's spatial and
 * typographic roles, not a chroma bypass, so they are admitted by name
 * rather than by prefix — an unnamed `--cn-*` token still fails.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const diceCss = readFileSync(join(packageRoot, 'styles', 'dice.css'), 'utf8');

const CUSTOM_PROPERTY = /--[A-Za-z0-9_-]+/g;

/** The two endpoints the seven-die mix uses. */
const ADMITTED_CHROMA_TOKENS = new Set([
  '--chroma-warning-90',
  '--chroma-warning-40',
]);

/** The only `--cn-*` semantic tokens Dice legitimately consumes. */
const ADMITTED_CN_TOKENS = new Set(['--cn-line', '--cn-font-size-text']);

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function customProperties(source: string): string[] {
  return stripComments(source).match(CUSTOM_PROPERTY) ?? [];
}

const properties = customProperties(diceCss);

test('references at least one custom property', () => {
  expect(properties.length).toBeGreaterThan(0);
});

test('every custom property is an admitted --chroma-warning-* endpoint, an admitted --cn-* token, or package-private', () => {
  const outliers = properties.filter(
    (name) =>
      !ADMITTED_CHROMA_TOKENS.has(name) &&
      !ADMITTED_CN_TOKENS.has(name) &&
      !name.startsWith('--_dice-'),
  );
  expect(outliers).toEqual([]);
});

test('no --chroma-* reference falls outside the two admitted endpoints', () => {
  const offContract = properties.filter(
    (name) => name.startsWith('--chroma-') && !ADMITTED_CHROMA_TOKENS.has(name),
  );
  expect(offContract).toEqual([]);
});

test('no --cn-* reference falls outside the two admitted semantic tokens', () => {
  const offContract = properties.filter(
    (name) => name.startsWith('--cn-') && !ADMITTED_CN_TOKENS.has(name),
  );
  expect(offContract).toEqual([]);
});

describe('every admitted side count is used', () => {
  for (const sides of [2, 4, 6, 8, 10, 12, 20]) {
    test(`d${sides} is a selector in the stylesheet`, () => {
      expect(diceCss).toContain(`data-sides="${sides}"`);
    });
  }
});

test('every admitted chroma endpoint is actually referenced', () => {
  for (const token of ADMITTED_CHROMA_TOKENS) {
    expect(diceCss).toContain(`var(${token})`);
  }
});

/**
 * The ramp itself: seven dice, each mixed a fixed fraction of the way from
 * `--chroma-warning-90` (the light endpoint) toward `--chroma-warning-40`
 * (the dark endpoint) — the operator's ruling that the five intermediate
 * dice sit at 1/6 through 5/6, equidistant in lightness because both
 * endpoints share chroma and hue. This pins the ramp itself, so an edit
 * that bends, reverses, or drops a step fails here rather than only in the
 * contrast suite.
 */
describe('the seven-die ramp mixes the two endpoints at equidistant fractions, light to dark', () => {
  const faceBlocks = stripComments(diceCss)
    .split(/(?=\.dice\[data-sides="\d+"\]::before)/)
    .filter((block) => /^\.dice\[data-sides="\d+"\]::before/.test(block));

  function backgroundOf(sides: number): string {
    const block = faceBlocks.find((b) =>
      b.startsWith(`.dice[data-sides="${sides}"]::before`),
    );
    if (!block) throw new Error(`No ::before block found for d${sides}`);
    const match = block.match(/background:\s*([^;]+);/);
    if (!match)
      throw new Error(`No background declaration found for d${sides}`);
    return match[1].replace(/\s+/g, ' ').trim();
  }

  test('d2 is the light endpoint, unmixed', () => {
    expect(backgroundOf(2)).toBe('var(--chroma-warning-90)');
  });

  test('d20 is the dark endpoint, unmixed', () => {
    expect(backgroundOf(20)).toBe('var(--chroma-warning-40)');
  });

  /** sides -> exact fraction (out of six) toward the dark endpoint. */
  const FRACTIONS: [number, number][] = [
    [4, 1],
    [6, 2],
    [8, 3],
    [10, 4],
    [12, 5],
  ];

  for (const [sides, sixths] of FRACTIONS) {
    test(`d${sides} mixes ${sixths}/6 of the way from --chroma-warning-90 to --chroma-warning-40`, () => {
      const background = backgroundOf(sides);
      expect(background).toMatch(/color-mix\(\s*in oklch/);
      expect(background).toContain('var(--chroma-warning-90)');
      expect(background).toContain('var(--chroma-warning-40)');
      const percentMatch = background.match(
        /var\(--chroma-warning-40\)\s+([\d.]+)%/,
      );
      expect(percentMatch, background).not.toBeNull();
      const percent = Number(percentMatch?.[1]);
      const expected = (sixths / 6) * 100;
      expect(percent).toBeCloseTo(expected, 2);
    });
  }

  test('the five mix fractions run strictly increasing, d4 through d12', () => {
    const percentages = FRACTIONS.map(([sides]) => {
      const background = backgroundOf(sides);
      const percentMatch = background.match(
        /var\(--chroma-warning-40\)\s+([\d.]+)%/,
      );
      return Number(percentMatch?.[1]);
    });
    for (let i = 1; i < percentages.length; i++) {
      expect(percentages[i]).toBeGreaterThan(percentages[i - 1]);
    }
  });
});
