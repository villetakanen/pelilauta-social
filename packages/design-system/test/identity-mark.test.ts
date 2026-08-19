/**
 * Holds the identity backdrop's token roles against the legibility the identity
 * mark promises.
 *
 * The backdrop is not a token: it is any mix of two, chosen per nick, so no
 * stylesheet states the colour a reader actually sees and the book can only show
 * the handful of nicks it names. A palette edit that darkens one end, or a new
 * role picked for --_on-avatar, breaks the mark for some fraction of the
 * community and for nobody on the page. That is what is computed here.
 *
 * --_avatar-backdrop-from/-to and --_on-avatar are private to CnAvatar
 * (docs/ARCHITECTURE.md), so they are read from the component's own style
 * block rather than from a root stylesheet; the private values still
 * reference public --chroma-* roles, so they resolve against the same
 * stylesheet token map as before.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  contrast,
  type Mode,
  type Oklch,
  resolve,
  tokenMap,
} from '../books/specimens/color';

const styles = (path: string) =>
  readFileSync(new URL(`../styles/${path}`, import.meta.url), 'utf8');

const componentSource = readFileSync(
  new URL('../components/CnAvatar.svelte', import.meta.url),
  'utf8',
);

/** Just the `<style>` block: the script section's template literals for
 * `--cn-avatar-mix` are not declarations and must not be parsed as one. */
const componentStyle = componentSource.match(/<style>([\s\S]*)<\/style>/)?.[1];
if (!componentStyle) {
  throw new Error('CnAvatar.svelte has no <style> block to read tokens from.');
}

const tokens = tokenMap(
  styles('chroma.css'),
  styles('semantic.css'),
  componentStyle,
);

const color = (token: string, mode: Mode): Oklch => {
  const value = resolve(`var(${token})`, mode, tokens);
  if (!value) throw new Error(`${token} does not resolve in ${mode}`);
  return value;
};

/** `color-mix(in oklch, a, b <percent>%)`, hue on the shorter arc. */
function mix(a: Oklch, b: Oklch, percent: number): Oklch {
  const t = percent / 100;
  let delta = b.h - a.h;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: (a.h + delta * t + 360) % 360,
  };
}

/** Every percentage the component can derive, ends included. */
const percentages = Array.from({ length: 101 }, (_, index) => index);

describe('the initials are legible on every backdrop a nick can derive', () => {
  for (const mode of ['light', 'dark'] as const) {
    test(`--_on-avatar over the whole mix range, ${mode}`, () => {
      const from = color('--_avatar-backdrop-from', mode);
      const to = color('--_avatar-backdrop-to', mode);
      const on = color('--_on-avatar', mode);

      const worst = percentages
        .map((percent) => ({
          percent,
          ratio: contrast(on, mix(from, to, percent)),
        }))
        .reduce((a, b) => (a.ratio < b.ratio ? a : b));

      expect(
        worst.ratio,
        `${worst.ratio.toFixed(2)}:1 at ${worst.percent}%`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('the mark reads as a shape against the page behind it', () => {
  for (const mode of ['light', 'dark'] as const) {
    test(`the backdrop range against --cn-surface, ${mode}`, () => {
      const from = color('--_avatar-backdrop-from', mode);
      const to = color('--_avatar-backdrop-to', mode);
      const surface = color('--cn-surface', mode);

      const worst = percentages
        .map((percent) => ({
          percent,
          ratio: contrast(mix(from, to, percent), surface),
        }))
        .reduce((a, b) => (a.ratio < b.ratio ? a : b));

      // WCAG 1.4.11: a non-text shape needs 3:1 to be perceivable.
      expect(
        worst.ratio,
        `${worst.ratio.toFixed(2)}:1 at ${worst.percent}%`,
      ).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('the anonymous mark, which derives nothing', () => {
  for (const mode of ['light', 'dark'] as const) {
    test(`--cn-on-surface over --cn-surface-2, ${mode}`, () => {
      const ratio = contrast(
        color('--cn-on-surface', mode),
        color('--cn-surface-2', mode),
      );
      expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    });
  }
});
