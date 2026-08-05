/**
 * Contrast guardrails for the semantic colour roles.
 *
 * The design-tokens spec makes readable contrast part of the token intent in
 * every supported mode. That is only checkable by computing it: the palette is
 * OKLCH, the semantic layer states both modes in one `light-dark()` declaration,
 * and the resulting ratio appears in no stylesheet.
 *
 * These tests are also what keeps the colour books honest. v20's colour book
 * publishes a contrast guardrail naming the wrong surface and quoting a ratio
 * that belongs to neither — the failure this file exists to prevent here.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  contrast,
  grade,
  measure,
  parseOklch,
  resolve,
  tokenMap,
} from '../books/specimens/color';

const styles = (path: string) =>
  readFileSync(new URL(`../styles/${path}`, import.meta.url), 'utf8');

const tokens = tokenMap(
  styles('color-reference.css'),
  styles('color-theme.css'),
);

describe('the colour maths', () => {
  test('black against white is the full WCAG range', () => {
    const ratio = contrast({ l: 0, c: 0, h: 0 }, { l: 1, c: 0, h: 0 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  test('a colour against itself is 1', () => {
    const grey = parseOklch('oklch(0.5 0.14 242)');
    if (!grey) throw new Error('unparsed');
    expect(contrast(grey, grey)).toBeCloseTo(1, 5);
  });

  test('grading follows WCAG 2.1 thresholds', () => {
    expect(grade(4.5)).toBe('AA');
    expect(grade(4.49)).toBe('AA Large');
    expect(grade(3)).toBe('AA Large');
    expect(grade(2.99)).toBe('Fail');
  });
});

describe('resolving a semantic token', () => {
  test('light-dark() yields a different colour per mode', () => {
    const light = resolve('var(--cn-surface)', 'light', tokens);
    const dark = resolve('var(--cn-surface)', 'dark', tokens);
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(light).not.toEqual(dark);
  });

  test('an alias chain resolves through to the reference layer', () => {
    // --cn-background is var(--cn-surface), which is light-dark() over two
    // reference tokens. Two hops, and the arm must survive both.
    expect(resolve('var(--cn-background)', 'dark', tokens)).toEqual(
      resolve('var(--cn-color-surface-20)', 'dark', tokens),
    );
  });

  test('an undefined token resolves to nothing rather than to a default', () => {
    expect(resolve('var(--cn-not-a-token)', 'light', tokens)).toBeUndefined();
  });

  test('a cycle terminates instead of hanging', () => {
    const cyclic = new Map([
      ['--a', 'var(--b)'],
      ['--b', 'var(--a)'],
    ]);
    expect(resolve('var(--a)', 'light', cyclic)).toBeUndefined();
  });
});

describe('body text meets AA on every base surface', () => {
  const cases = [
    ['--cn-text', '--cn-surface'],
    ['--cn-text', '--cn-background'],
    ['--cn-on-surface', '--cn-surface'],
    ['--cn-text-low', '--cn-surface'],
    ['--cn-link', '--cn-surface'],
  ] as const;

  for (const [foreground, background] of cases) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${foreground} on ${background}, ${mode}`, () => {
        const { ratio } = measure(foreground, background, mode, tokens);
        expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('the step gap predicts contrast', () => {
  // A step number is a lightness (see color-palette.test.ts), so the distance
  // between two steps in one family bounds their contrast from below. The book
  // publishes these thresholds as the rule for picking a pair without measuring
  // one, so they are floors over every same-family pair in the palette, not
  // figures from a convenient example.
  const palette = [
    ...readFileSync(
      new URL('../styles/color-reference.css', import.meta.url),
      'utf8',
    ).matchAll(/--cn-color-(\w+)-(\d+):\s*(oklch\([^)]+\))/g),
  ].map((match) => ({
    family: match[1],
    step: Number(match[2]),
    color: parseOklch(match[3]),
  }));

  /** The worst contrast any same-family pair at least `gap` apart produces. */
  function floorAt(gap: number): number {
    let worst = Number.POSITIVE_INFINITY;
    for (const a of palette) {
      for (const b of palette) {
        if (a.family !== b.family || a.step - b.step < gap) continue;
        if (!a.color || !b.color) throw new Error('unparsed palette entry');
        worst = Math.min(worst, contrast(a.color, b.color));
      }
    }
    return worst;
  }

  test('a gap of 60 or more is always AA', () => {
    expect(floorAt(60)).toBeGreaterThanOrEqual(4.5);
  });

  test('a gap of 70 or more is always AAA', () => {
    expect(floorAt(70)).toBeGreaterThanOrEqual(7);
  });

  test('a gap of 45 or more is at least AA Large', () => {
    expect(floorAt(45)).toBeGreaterThanOrEqual(3);
  });

  test('a gap of 40 does not reach AA Large', () => {
    // Fails the book's own rule if someone rounds the numbers down.
    expect(floorAt(40)).toBeLessThan(3);
  });
});

describe('the elevation-4 guardrail', () => {
  test('--cn-text-high stays readable on it', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { ratio } = measure(
        '--cn-text-high',
        '--cn-surface-4',
        mode,
        tokens,
      );
      expect(ratio, `${mode} at ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});
