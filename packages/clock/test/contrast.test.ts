/**
 * Verifies that `--cn-color-info` and `--cn-color-surface` maintain at least
 * ΔL 0.40 lightness separation in light and dark schemes.
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
