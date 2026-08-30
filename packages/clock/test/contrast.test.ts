/**
 * Contrast guardrail for Clock, per `specs/clock/spec.md`'s Definition of
 * Done and Regression Guardrails: completed slices (`--cn-color-info`) and
 * uncompleted slices (`--cn-color-surface`) separate by at least ΔL 0.40 in
 * both colour schemes in the default theme (the spec names the exact figures
 * as ΔL 0.45 in light and ΔL 0.70 in dark).
 *
 * Clock carries no colour logic of its own — both tokens are consumed
 * directly by `styles/clock.css` — so this resolves the two semantic
 * declarations the same way `packages/dice/test/contrast.test.ts` resolves
 * dice's colour-mix chain: fold each token to a single OKLCH triplet and
 * compare lightness, rather than reading a contrast ratio (a different
 * metric, and not what the spec states).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  type Oklch,
  resolve,
  tokenMap,
} from '../../design-system/books/specimens/color';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

const tokens = tokenMap(
  read('../../design-system/styles/chroma.css'),
  read('../../design-system/styles/semantic.css'),
);

function resolveOrThrow(value: string, mode: 'light' | 'dark'): Oklch {
  const resolved = resolve(value, mode, tokens);
  if (!resolved) throw new Error(`Could not resolve ${value} in ${mode} mode`);
  return resolved;
}

describe('--cn-color-info and --cn-color-surface separate by at least ΔL 0.40', () => {
  test('light scheme — ΔL 0.45', () => {
    const info = resolveOrThrow('var(--cn-color-info)', 'light');
    const surface = resolveOrThrow('var(--cn-color-surface)', 'light');
    const deltaL = Math.abs(info.l - surface.l);
    expect(deltaL).toBeGreaterThanOrEqual(0.4);
    expect(deltaL).toBeCloseTo(0.45, 5);
  });

  test('dark scheme — ΔL 0.70', () => {
    const info = resolveOrThrow('var(--cn-color-info)', 'dark');
    const surface = resolveOrThrow('var(--cn-color-surface)', 'dark');
    const deltaL = Math.abs(info.l - surface.l);
    expect(deltaL).toBeGreaterThanOrEqual(0.4);
    expect(deltaL).toBeCloseTo(0.7, 5);
  });
});
