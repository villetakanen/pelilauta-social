/**
 * Contrast guardrail for Dice, per specs/dice/spec.md's Definition of Done:
 * "every declared text and face pair measures at least 4.5:1 in the default
 * primary family."
 *
 * This suite currently pins a second trial, at the operator's request, on
 * top of the first: seven dice no longer share four paired
 * `--chroma-warning-*` steps, they each take a bespoke colour
 * `color-mix()`ed along the warning scale, between the two declared
 * endpoints `--chroma-warning-90` (light) and `--chroma-warning-40` (dark),
 * at six equidistant lightness intervals — `styles/dice.css`'s colour-ramp
 * comment states the ruling in full, and names this a licensed deviation
 * from the rule that a direct-chroma consumer's colour is an exact declared
 * step.
 *
 * Dice reads `--chroma-*` directly rather than through the semantic layer
 * (it is the one declared direct-chroma consumer), so no existing
 * design-system contrast suite covers it. This reuses the same OKLCH maths
 * `packages/design-system/test/color-contrast.test.ts` uses — `resolve()`
 * already follows a `color-mix(in oklch, …)` chain to a single OKLCH
 * triplet, the same way the CSS cascade would, so the seven mixed
 * backgrounds measure exactly as declared, with no extra resolution layer
 * needed here.
 *
 * d8 is a named, operator-ruled exception: the operator moved it from black
 * text to white, putting the black/white boundary between d6 and d8 instead
 * of between d8 and d10. Measured, white on d8 is 3.37:1 - below the 4.5:1
 * AA floor. That is not weakened or dropped here: d8 is pinned to its exact
 * measured ratio in its own test below, the "meets AA on the mixed ramp"
 * suite excludes only d8 and still asserts AA on every other face, and a
 * regression in either direction - d8 drifting off its pinned ratio, or
 * another face slipping under AA - fails the suite.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  contrast,
  parseOklch,
  resolve,
  tokenMap,
} from '../../design-system/books/specimens/color';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

const tokens = tokenMap(
  read('../../design-system/styles/chroma.css'),
  read('../../design-system/styles/semantic.css'),
  read('../styles/dice.css'),
);

/** The mixed OKLCH endpoints, read straight from the palette. */
const LIGHT_ENDPOINT = parseOklch(tokens.get('--chroma-warning-90') ?? '');
const DARK_ENDPOINT = parseOklch(tokens.get('--chroma-warning-40') ?? '');

if (!LIGHT_ENDPOINT || !DARK_ENDPOINT) {
  throw new Error('Could not parse the warning-90/warning-40 OKLCH endpoints.');
}

/**
 * Every admitted side count, its declared background expression (as
 * `styles/dice.css` writes it), the expected mix fraction toward the dark
 * endpoint (0 = light endpoint itself, 1 = dark endpoint itself), and the
 * text colour the stylesheet assigns it.
 */
const FACES = [
  {
    sides: 2,
    value: 'var(--chroma-warning-90)',
    fraction: 0 / 6,
    text: '--_dice-text-black',
  },
  {
    sides: 4,
    value:
      'color-mix(in oklch, var(--chroma-warning-90), var(--chroma-warning-40) 16.6667%)',
    fraction: 1 / 6,
    text: '--_dice-text-black',
  },
  {
    sides: 6,
    value:
      'color-mix(in oklch, var(--chroma-warning-90), var(--chroma-warning-40) 33.3333%)',
    fraction: 2 / 6,
    text: '--_dice-text-black',
  },
  {
    sides: 8,
    value:
      'color-mix(in oklch, var(--chroma-warning-90), var(--chroma-warning-40) 50%)',
    fraction: 3 / 6,
    text: '--_dice-text-white',
  },
  {
    sides: 10,
    value:
      'color-mix(in oklch, var(--chroma-warning-90), var(--chroma-warning-40) 66.6667%)',
    fraction: 4 / 6,
    text: '--_dice-text-white',
  },
  {
    sides: 12,
    value:
      'color-mix(in oklch, var(--chroma-warning-90), var(--chroma-warning-40) 83.3333%)',
    fraction: 5 / 6,
    text: '--_dice-text-white',
  },
  {
    sides: 20,
    value: 'var(--chroma-warning-40)',
    fraction: 6 / 6,
    text: '--_dice-text-white',
  },
] as const;

function faceColor(sides: number) {
  const face = FACES.find((f) => f.sides === sides);
  if (!face) throw new Error(`No face for d${sides}`);
  const resolved = resolve(face.value, 'light', tokens);
  if (!resolved) throw new Error(`Could not resolve d${sides}'s background.`);
  return resolved;
}

describe('every declared text and face pair meets AA on the mixed ramp', () => {
  // d8 is a named, operator-ruled exception below the AA floor — pinned in
  // its own test below, not asserted here.
  for (const { sides, text } of FACES.filter((face) => face.sides !== 8)) {
    test(`d${sides} — ${text} on its own mixed face`, () => {
      const face = faceColor(sides);
      const textColor =
        text === '--_dice-text-white'
          ? { l: 1, c: 0, h: 0 }
          : { l: 0, c: 0, h: 0 };
      const ratio = contrast(face, textColor);
      expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    });
  }
});

test('d8 — --_dice-text-white on its own mixed face is an operator-ruled exception below AA', () => {
  const face = faceColor(8);
  const white = { l: 1, c: 0, h: 0 };
  const ratio = contrast(face, white);
  // Pinned exactly, so any drift — from either side of the ramp — still
  // fails: the operator ruled white on d8 despite the shortfall, not that
  // the shortfall may grow or shrink unnoticed.
  expect(ratio).toBeCloseTo(3.3693, 3);
  expect(ratio).toBeLessThan(4.5);
});

test('white and black text are each used on the sides the measured boundary assigns them', () => {
  const white = FACES.filter((face) => face.text === '--_dice-text-white').map(
    (face) => face.sides,
  );
  const black = FACES.filter((face) => face.text === '--_dice-text-black').map(
    (face) => face.sides,
  );
  // d6/d8 is the measured boundary the ramp alone would draw (§colour-ramp
  // comment); d8 sits on the white side of it by the operator's ruling, not
  // by measurement.
  expect(black).toEqual([2, 4, 6]);
  expect(white).toEqual([8, 10, 12, 20]);
});

describe('the seven dice sit at equidistant lightness along the mixed ramp', () => {
  test('each face resolves to the endpoints’ chroma and hue (mixing two equal-C/H colours moves only L)', () => {
    for (const { sides } of FACES) {
      const face = faceColor(sides);
      expect(face.c).toBeCloseTo(LIGHT_ENDPOINT.c, 6);
      expect(face.c).toBeCloseTo(DARK_ENDPOINT.c, 6);
      expect(face.h).toBeCloseTo(LIGHT_ENDPOINT.h, 6);
    }
  });

  test('lightness runs light (d2) to dark (d20), one 0.0833 step at a time', () => {
    const span = LIGHT_ENDPOINT.l - DARK_ENDPOINT.l;
    const step = span / 6;
    for (const { sides, fraction } of FACES) {
      const face = faceColor(sides);
      const expectedL = LIGHT_ENDPOINT.l - span * fraction;
      expect(face.l).toBeCloseTo(expectedL, 3);
    }
    expect(step).toBeCloseTo(0.0833, 3);
  });

  test('consecutive dice are equidistant in lightness, within a hairline', () => {
    const lightnesses = FACES.map(({ sides }) => faceColor(sides).l);
    const deltas = lightnesses.slice(1).map((l, i) => lightnesses[i] - l);
    for (const delta of deltas) {
      expect(delta).toBeCloseTo(deltas[0], 3);
    }
  });

  test('d2 is the light endpoint and d20 is the dark endpoint, unmixed', () => {
    expect(faceColor(2)).toEqual(LIGHT_ENDPOINT);
    expect(faceColor(20)).toEqual(DARK_ENDPOINT);
  });
});

/**
 * Face-to-page separation: every face must read against both a light and a
 * dark page. The mix spans the same lightness range the old four-step ramp
 * did (0.90 to 0.40), so the weakest separations still sit at the ramp's
 * light end against the light page and its dark end against the dark page.
 */
describe('every face separates from the page behind it, in both colour schemes', () => {
  for (const { sides } of FACES) {
    test(`d${sides} vs the light page (--cn-color-surface, light)`, () => {
      const surface = resolve('var(--cn-color-surface)', 'light', tokens);
      if (!surface)
        throw new Error('Could not resolve the light page surface.');
      const ratio = contrast(faceColor(sides), surface);
      expect(ratio).toBeGreaterThan(1);
    });

    test(`d${sides} vs the dark page (--cn-color-surface, dark)`, () => {
      const surface = resolve('var(--cn-color-surface)', 'dark', tokens);
      if (!surface) throw new Error('Could not resolve the dark page surface.');
      const ratio = contrast(faceColor(sides), surface);
      expect(ratio).toBeGreaterThan(1);
    });
  }

  test('the two weakest face-to-page separations are d2 vs the light page and d4 vs the light page', () => {
    const lightSurface = resolve('var(--cn-color-surface)', 'light', tokens);
    const darkSurface = resolve('var(--cn-color-surface)', 'dark', tokens);
    if (!lightSurface || !darkSurface) {
      throw new Error('Could not resolve both page surfaces.');
    }
    const separations = FACES.flatMap(({ sides }) => [
      {
        label: `d${sides} vs light`,
        ratio: contrast(faceColor(sides), lightSurface),
      },
      {
        label: `d${sides} vs dark`,
        ratio: contrast(faceColor(sides), darkSurface),
      },
    ]).sort((a, b) => a.ratio - b.ratio);

    expect(separations[0].label).toBe('d2 vs light');
    expect(separations[0].ratio).toBeCloseTo(1.45, 1);
    expect(separations[1].label).toBe('d4 vs light');
    expect(separations[1].ratio).toBeCloseTo(1.75, 1);
  });
});
