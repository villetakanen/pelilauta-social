/**
 * How the reference palette is built.
 *
 * The Colour System book teaches these rules, so they are asserted rather than
 * described: a step number is a lightness, a family holds one hue, and the
 * status families are four steps deep. tokens/themes/default.json is the
 * single writable source; a palette edit that breaks one of these makes the
 * book wrong, and nothing else would say so.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const theme = JSON.parse(
  readFileSync(
    new URL('../tokens/themes/default.json', import.meta.url),
    'utf8',
  ),
) as {
  families: Record<string, { kind: string; steps: Record<string, string> }>;
  lightnessExceptions?: Record<string, Record<string, string>>;
};

const OKLCH = /^oklch\((\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+)\)$/;
const CORE_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
const AUXILIARY_STEPS = [20, 40, 60, 90];

interface Step {
  family: string;
  kind: string;
  step: number;
  l: number;
  c: number;
  h: number;
}

const steps: Step[] = Object.entries(theme.families).flatMap(
  ([familyName, definition]) =>
    Object.entries(definition.steps).map(([step, value]) => {
      const match = OKLCH.exec(value);
      if (!match)
        throw new Error(
          `${familyName}-${step}: '${value}' is not literal oklch()`,
        );
      return {
        family: familyName,
        kind: definition.kind,
        step: Number(step),
        l: Number(match[1]),
        c: Number(match[2]),
        h: Number(match[3]),
      };
    }),
);

const family = (name: string) => steps.filter((step) => step.family === name);
const exceptionDeclared = (familyName: string, step: number) =>
  Boolean(theme.lightnessExceptions?.[familyName]?.[String(step)]);

test('the palette is declared entirely in oklch', () => {
  const values = Object.values(theme.families).flatMap((definition) =>
    Object.values(definition.steps),
  );
  expect(steps).toHaveLength(values.length);
  for (const value of values) expect(value).toMatch(OKLCH);
});

test('every family kind is core or auxiliary', () => {
  for (const [name, definition] of Object.entries(theme.families)) {
    expect(['core', 'auxiliary'], name).toContain(definition.kind);
  }
});

describe('a step number is its perceived lightness', () => {
  // The property the whole book rests on: --chroma-surface-50 is oklch L 0.5,
  // so the number predicts contrast without resolving anything.
  for (const step of steps) {
    const name = `${step.family}-${step.step}`;
    const expectedL = step.step / 100;

    if (Math.abs(step.l - expectedL) > 1e-9) {
      test(`${name} declares its exception rather than silently diverging`, () => {
        expect(
          exceptionDeclared(step.family, step.step),
          `${name} is L ${step.l}, not ${expectedL}, but lightnessExceptions has no entry for it`,
        ).toBe(true);
      });
      continue;
    }

    test(name, () => {
      expect(step.l).toBeCloseTo(expectedL, 5);
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
  test('core families carry exactly the 13 steps', () => {
    for (const [name, definition] of Object.entries(theme.families)) {
      if (definition.kind !== 'core') continue;
      expect(
        family(name)
          .map((step) => step.step)
          .sort((a, b) => a - b),
        name,
      ).toEqual(CORE_STEPS);
    }
  });

  test('status families are four steps and no more', () => {
    for (const name of ['error', 'warning', 'love']) {
      expect(
        family(name)
          .map((step) => step.step)
          .sort((a, b) => a - b),
        name,
      ).toEqual(AUXILIARY_STEPS);
    }
  });
});

describe('chroma', () => {
  test('it peaks in the middle of a ramp and falls to zero at both ends', () => {
    const surface = family('surface');
    const first = surface.find((step) => step.step === 0);
    const last = surface.find((step) => step.step === 100);
    const peak = Math.max(...surface.map((step) => step.c));

    expect(first?.c).toBe(0);
    expect(last?.c).toBe(0);
    expect(peak).toBeGreaterThan(0.1);
  });
});
