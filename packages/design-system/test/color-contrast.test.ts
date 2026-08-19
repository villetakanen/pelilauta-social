/**
 * Contrast guardrails for the semantic colour roles.
 *
 * The design-tokens spec makes readable contrast part of the token intent in
 * every supported mode. That is only checkable by computing it: the palette is
 * OKLCH, the semantic layer states both modes in one `light-dark()` declaration,
 * and the resulting ratio appears in no stylesheet.
 *
 * These tests are also what keeps the colour books honest. A book that states a
 * guardrail as prose can name the wrong role or quote a ratio belonging to
 * another pair and still read correctly; the numbers are computed here so the
 * books cite them rather than restate them.
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
import { parseTokens } from '../books/specimens/tokenTable';

const styles = (path: string) =>
  readFileSync(new URL(`../styles/${path}`, import.meta.url), 'utf8');

const tokens = tokenMap(styles('chroma.css'), styles('semantic.css'));

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
      resolve('var(--chroma-surface-20)', 'dark', tokens),
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
      new URL('../styles/chroma.css', import.meta.url),
      'utf8',
    ).matchAll(/--chroma-(\w+)-(\d+):\s*(oklch\([^)]+\))/g),
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
  // Level 4 leaves the surface family, so it is the one level whose foreground
  // pairing cannot be read off the step gap. Surface sets no foreground, which
  // means an elevation-4 element with no override inherits `--cn-text` from the
  // body. That inherited default is the pairing that has to hold: a consumer who
  // forgets to choose gets it, and no rule anywhere else catches them.

  test('the inherited body foreground is readable on it', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { ratio } = measure('--cn-text', '--cn-surface-4', mode, tokens);
      expect(ratio, `${mode} at ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  test('the roles a consumer may raise to are readable on it', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const foreground of ['--cn-text-high', '--cn-text-heading']) {
        const { ratio } = measure(foreground, '--cn-surface-4', mode, tokens);
        expect(
          ratio,
          `${foreground} in ${mode} at ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('the de-emphasised roles do not survive it in Dark', () => {
    // Asserted in both directions. A palette change that makes these pass means
    // the specs and books telling consumers to raise their foreground at this
    // level are out of date, and this test is where that is noticed.
    for (const foreground of ['--cn-text-low', '--cn-link']) {
      const { ratio } = measure(foreground, '--cn-surface-4', 'dark', tokens);
      expect(ratio, `${foreground} at ${ratio.toFixed(2)}:1`).toBeLessThan(4.5);
    }
  });
});

describe('the indicator marks persistent state legibly', () => {
  // The foreground identifies the current destination and the tint reinforces
  // it, so the foreground is what has to hold: opaque, and readable on every
  // surface a chrome action stands on. `--cn-surface` is the resting chrome and
  // `--cn-surface-4` is what a covering tray paints, which is the tighter of the
  // two in Dark.
  //
  // The indicator surface is one neutral step off the surface it sits on, so it
  // is a reinforcement rather than the carrier and is not measured against a 3:1
  // threshold it was never asked to meet. A brand tint would not meet one
  // either: composited over the dark `--cn-surface-4`, primary at 20% reaches
  // 1.3:1 and at 60% only 2.4:1, against a hover wash at 1.2:1 — and what
  // separates those is hue, which this luminance-only maths cannot see and a
  // reader with a colour-vision deficiency may not either.

  for (const mode of ['light', 'dark'] as const) {
    for (const surface of ['--cn-surface', '--cn-surface-4']) {
      test(`--cn-on-indicator reaches AA on ${surface}, ${mode}`, () => {
        const { ratio } = measure('--cn-on-indicator', surface, mode, tokens);
        expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }

    test(`--cn-on-indicator is not the foreground a non-current action inherits, ${mode}`, () => {
      // Identification cannot rest on the tint alone, so the foreground has to
      // actually change. Resolved colours, not declaration text, so two
      // spellings of one colour cannot pass.
      const indicated = resolve('var(--cn-on-indicator)', mode, tokens);
      expect(indicated).toBeDefined();
      for (const inherited of ['--cn-on-surface', '--cn-text']) {
        expect(indicated).not.toEqual(
          resolve(`var(${inherited})`, mode, tokens),
        );
      }
    });
  }
});

describe('a message is readable in its bubble', () => {
  // The bubble colours leave the surface family, so no step gap predicts them:
  // a message sits on a neutral step in the default variant and on a brand step
  // in the reply variant, and each pairs with a foreground of its own. The pair
  // is the whole of what CnBubble paints, and a consumer overrides neither.
  //
  // The pair is private to CnBubble (docs/ARCHITECTURE.md: `--_*`), declared on
  // the component's root rather than `:root`, so it is read out of the
  // component source rather than out of semantic.css. Chroma stays global, so
  // the reference layer still resolves the private declarations' `var()`
  // chains.

  const componentStyle = readFileSync(
    new URL('../components/CnBubble.svelte', import.meta.url),
    'utf8',
  ).match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1];
  if (!componentStyle) throw new Error('CnBubble.svelte has no style block');

  const bubbleTokens = tokenMap(styles('chroma.css'), componentStyle);

  const cases = [
    ['--_on-bubble', '--_bubble'],
    ['--_on-reply-bubble', '--_reply-bubble'],
  ] as const;

  for (const [foreground, background] of cases) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${foreground} on ${background}, ${mode}`, () => {
        const { ratio } = measure(foreground, background, mode, bubbleTokens);
        expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
