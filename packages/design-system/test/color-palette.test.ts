/**
 * How the reference palette is built.
 *
 * The Colour System book teaches these rules, so they are asserted rather than
 * described: a step number is a lightness, a family holds one hue, and the
 * status families are four steps deep. A palette edit that breaks one of these
 * makes the book wrong, and nothing else would say so.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(
  new URL('../styles/color-reference.css', import.meta.url),
  'utf8',
);

interface Step {
  family: string;
  step: number;
  l: number;
  c: number;
  h: number;
}

const steps: Step[] = [
  ...source.matchAll(
    /--cn-color-(\w+)-(\d+):\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g,
  ),
].map((match) => ({
  family: match[1],
  step: Number(match[2]),
  l: Number(match[3]),
  c: Number(match[4]),
  h: Number(match[5]),
}));

const family = (name: string) => steps.filter((step) => step.family === name);

test('the palette is declared entirely in oklch', () => {
  const declarations = source.match(/--cn-color-[\w-]+:/g) ?? [];
  expect(steps).toHaveLength(declarations.length);
});

describe('a step number is its perceived lightness', () => {
  // The property the whole book rests on: --cn-color-surface-50 is oklch L 0.5,
  // so the number predicts contrast without resolving anything.
  for (const step of steps) {
    const name = `--cn-color-${step.family}-${step.step}`;

    // v20 states primary-10 at L 0.12 rather than 0.10, and ours is a faithful
    // port of that file. Asserted as the single exception so it cannot be
    // silently "corrected" into a divergence from the authority, and cannot
    // quietly grow a second one.
    if (name === '--cn-color-primary-10') {
      test(`${name} is v20's documented exception`, () => {
        expect(step.l).toBe(0.12);
      });
      continue;
    }

    test(name, () => {
      expect(step.l).toBeCloseTo(step.step / 100, 5);
    });
  }
});

describe('hue', () => {
  test('surface holds one hue at every step', () => {
    expect(new Set(family('surface').map((step) => step.h))).toEqual(
      new Set([242]),
    );
  });

  test('every status family holds one hue', () => {
    for (const name of ['error', 'warning', 'love']) {
      expect(
        new Set(family(name).map((step) => step.h)),
        `${name} should not rotate`,
      ).toHaveProperty('size', 1);
    }
  });

  test('primary is the one ramp that rotates as it lightens', () => {
    const primary = family('primary');
    const hues = primary.map((step) => step.h);

    expect(new Set(hues).size).toBeGreaterThan(1);
    expect(hues[0]).toBe(185);
    expect(hues[hues.length - 1]).toBe(110);
    // Monotonic: it warms on the way up and never turns back.
    expect([...hues].sort((a, b) => b - a)).toEqual(hues);
  });
});

describe('depth', () => {
  test('primary and surface are the full ramps', () => {
    for (const name of ['primary', 'surface']) {
      expect(family(name).map((step) => step.step)).toEqual([
        0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100,
      ]);
    }
  });

  test('status families are four steps and no more', () => {
    for (const name of ['error', 'warning', 'love']) {
      expect(
        family(name).map((step) => step.step),
        name,
      ).toEqual([20, 40, 60, 90]);
    }
  });
});

describe('chroma', () => {
  test('it peaks in the middle of a ramp and falls to zero at both ends', () => {
    const surface = family('surface');
    const first = surface[0];
    const last = surface[surface.length - 1];
    const peak = Math.max(...surface.map((step) => step.c));

    expect(first.c).toBe(0);
    expect(last.c).toBe(0);
    expect(peak).toBeGreaterThan(0.1);
  });
});
