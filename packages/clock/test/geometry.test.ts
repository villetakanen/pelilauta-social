/**
 * Tests slice normalization, value clamping, step label resolution, and SVG
 * path generation against `specs/clock/spec.md`.
 */
import { describe, expect, test } from 'vitest';
import {
  buildSlicePaths,
  clampValue,
  normalizeTicks,
  resolveStepText,
  wrapValue,
} from '../geometry';

describe('normalizeTicks', () => {
  test('omitted defaults to 4 equal slices', () => {
    const slices = normalizeTicks();
    expect(slices).toEqual([
      { weight: 1 },
      { weight: 1 },
      { weight: 1 },
      { weight: 1 },
    ]);
  });

  test('an empty array defaults to 4 equal slices', () => {
    expect(normalizeTicks([])).toHaveLength(4);
  });

  test('an integer count generates that many equal slices', () => {
    const slices = normalizeTicks(6);
    expect(slices).toHaveLength(6);
    expect(slices.every((slice) => slice.weight === 1)).toBe(true);
  });

  test('an integer count below 2 defaults to 4 equal slices', () => {
    expect(normalizeTicks(1)).toHaveLength(4);
    expect(normalizeTicks(0)).toHaveLength(4);
  });

  test('a non-finite count defaults to 4 equal slices', () => {
    expect(normalizeTicks(Number.NaN)).toHaveLength(4);
    expect(normalizeTicks(Number.POSITIVE_INFINITY)).toHaveLength(4);
  });

  test('a weight array carries each declared weight through', () => {
    expect(normalizeTicks([1, 2, 3])).toEqual([
      { weight: 1 },
      { weight: 2 },
      { weight: 3 },
    ]);
  });

  test('a zero total weight defaults to 4 equal slices', () => {
    expect(normalizeTicks([0, 0, 0])).toHaveLength(4);
  });

  test('a descriptor array carries labels and weights through, defaulting a missing weight to 1', () => {
    expect(
      normalizeTicks([{ label: 'Spotted' }, { weight: 2, label: 'Alarmed' }]),
    ).toEqual([
      { weight: 1, label: 'Spotted' },
      { weight: 2, label: 'Alarmed' },
    ]);
  });
});

describe('clampValue', () => {
  test('truncates a fractional value toward zero', () => {
    expect(clampValue(2.8, 4)).toBe(2);
    expect(clampValue(-2.8, 4)).toBe(0);
  });

  test('resolves a non-finite value to 0', () => {
    expect(clampValue(Number.NaN, 4)).toBe(0);
    expect(clampValue(Number.POSITIVE_INFINITY, 4)).toBe(0);
  });

  test('clamps below 0 up to 0', () => {
    expect(clampValue(-5, 4)).toBe(0);
  });

  test('clamps above the total up to the total', () => {
    expect(clampValue(9, 4)).toBe(4);
  });
});

describe('wrapValue', () => {
  test('wraps past the top end back to 0', () => {
    expect(wrapValue(4, 1, 4)).toBe(0);
  });

  test('wraps below 0 to the total slice count', () => {
    expect(wrapValue(0, -1, 4)).toBe(4);
  });

  test('a step that stays in range is unaffected', () => {
    expect(wrapValue(2, 1, 4)).toBe(3);
    expect(wrapValue(2, -1, 4)).toBe(1);
  });
});

describe('resolveStepText', () => {
  const labelled = [{ label: 'Spotted' }, { label: 'Alarmed' }];
  const unlabelled = normalizeTicks(4);

  test("uses the active slice's declared label when present", () => {
    expect(resolveStepText(1, labelled)).toBe('Spotted');
    expect(resolveStepText(2, labelled)).toBe('Alarmed');
  });

  test('falls back to "{value}/{totalSlices}" when the active slice has no label', () => {
    expect(resolveStepText(0, unlabelled)).toBe('0/4');
    expect(resolveStepText(1, unlabelled)).toBe('1/4');
    expect(resolveStepText(4, unlabelled)).toBe('4/4');
  });

  test('falls back at value 0, where no slice is active yet', () => {
    expect(resolveStepText(0, labelled)).toBe('0/2');
  });
});

describe('buildSlicePaths', () => {
  /** Calculates the angle spanned by an SVG slice path. */
  function sweepOf(d: string, cx: number, cy: number): number {
    const match = d.match(
      /^M [\d.-]+ [\d.-]+ L ([\d.-]+) ([\d.-]+) A [\d.-]+ [\d.-]+ 0 \d [01] ([\d.-]+) ([\d.-]+) Z$/,
    );
    if (!match) throw new Error(`Path did not match the expected shape: ${d}`);
    const [x1, y1, x2, y2] = match.slice(1).map(Number);
    const start = Math.atan2(y1 - cy, x1 - cx);
    const end = Math.atan2(y2 - cy, x2 - cx);
    const sweep = end - start;
    return sweep <= 0 ? sweep + Math.PI * 2 : sweep;
  }

  test('weighted ticks [1, 2, 1] give the middle slice twice the arc of its neighbours', () => {
    const slices = normalizeTicks([1, 2, 1]);
    const paths = buildSlicePaths(slices, 48, 50);
    const [first, second, third] = paths.map((path) => sweepOf(path.d, 50, 50));
    expect(second / first).toBeCloseTo(2, 5);
    expect(second / third).toBeCloseTo(2, 5);
    expect(first).toBeCloseTo(third, 5);
  });

  test('equal ticks divide the circle into equal arcs', () => {
    const slices = normalizeTicks(4);
    const paths = buildSlicePaths(slices, 48, 50);
    const sweeps = paths.map((path) => sweepOf(path.d, 50, 50));
    for (const sweep of sweeps) {
      expect(sweep).toBeCloseTo(Math.PI / 2, 5);
    }
  });

  test('every slice starts where the previous one ended, closing the full turn', () => {
    const slices = normalizeTicks([1, 2, 1]);
    const paths = buildSlicePaths(slices, 48, 50);
    const sweeps = paths.map((path) => sweepOf(path.d, 50, 50));
    const total = sweeps.reduce((sum, sweep) => sum + sweep, 0);
    expect(total).toBeCloseTo(Math.PI * 2, 5);
  });

  /** Extracts coordinates from a two-arc full-turn path. */
  function fullTurnPoints(d: string) {
    const match = d.match(
      /^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+) A [\d.-]+ [\d.-]+ 0 1 1 ([\d.-]+) ([\d.-]+) A [\d.-]+ [\d.-]+ 0 1 1 ([\d.-]+) ([\d.-]+) Z$/,
    );
    if (!match) throw new Error(`Path did not match a two-arc full turn: ${d}`);
    const [cx, cy, x1, y1, xm, ym, x2, y2] = match.slice(1).map(Number);
    return { cx, cy, x1, y1, xm, ym, x2, y2 };
  }

  test('a single-weight array (ticks={[1]}) draws its one slice as a genuine closed disc', () => {
    const slices = normalizeTicks([1]);
    expect(slices).toHaveLength(1);
    const [path] = buildSlicePaths(slices, 46, 48);
    const { cx, cy, x1, y1, xm, ym, x2, y2 } = fullTurnPoints(path.d);

    expect(x1).toBe(x2);
    expect(y1).toBe(y2);
    expect(Math.hypot(xm - cx, ym - cy)).toBeCloseTo(46, 9);
    expect(xm).toBeCloseTo(2 * cx - x1, 9);
    expect(ym).toBeCloseTo(2 * cy - y1, 9);
  });

  test('a weight array where every other slice is zero also reaches a full turn', () => {
    const slices = normalizeTicks([5, 0, 0]);
    const paths = buildSlicePaths(slices, 46, 48);
    expect(paths).toHaveLength(3);

    const { cx, cy, x1, y1, xm, ym, x2, y2 } = fullTurnPoints(paths[0].d);
    expect(x1).toBe(x2);
    expect(y1).toBe(y2);
    expect(Math.hypot(xm - cx, ym - cy)).toBeCloseTo(46, 9);
    expect(xm).toBeCloseTo(2 * cx - x1, 9);
    expect(ym).toBeCloseTo(2 * cy - y1, 9);

    expect(paths[1].d).not.toMatch(/A [\d.-]+ [\d.-]+ 0 1 1/);
    expect(paths[2].d).not.toMatch(/A [\d.-]+ [\d.-]+ 0 1 1/);
  });

  test('a slice short of a full turn still renders as a single-arc wedge, unchanged', () => {
    const slices = normalizeTicks([1, 2, 1]);
    const paths = buildSlicePaths(slices, 48, 50);
    for (const path of paths) {
      expect(path.d).toMatch(
        /^M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+ A [\d.-]+ [\d.-]+ 0 \d [01] [\d.-]+ [\d.-]+ Z$/,
      );
    }
  });

  test('produces no NaN in path geometry across positive tick counts and weights', () => {
    const cases: Array<number | number[]> = [
      2,
      3,
      4,
      5,
      10,
      100,
      [1, 2, 1],
      [1, 1, 1, 1, 1],
      [0.5, 1.5],
    ];
    for (const ticks of cases) {
      const slices = normalizeTicks(ticks);
      const paths = buildSlicePaths(slices, 48, 50);
      for (const path of paths) {
        expect(path.d).not.toContain('NaN');
      }
    }
  });
});
