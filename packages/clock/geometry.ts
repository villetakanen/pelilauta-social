/**
 * `geometry.ts` generates SVG slice paths and step labels from tick definitions
 * and progress values. `specs/clock/spec.md` governs dial geometry.
 */

export interface SliceDescriptor {
  weight?: number;
  label?: string;
}

export type Ticks = number | number[] | SliceDescriptor[];

export interface Slice {
  weight: number;
  label?: string;
}

const DEFAULT_SLICE_COUNT = 4;

function defaultSlices(): Slice[] {
  return Array.from({ length: DEFAULT_SLICE_COUNT }, () => ({ weight: 1 }));
}

function isDescriptor(entry: unknown): entry is SliceDescriptor {
  return typeof entry === 'object' && entry !== null;
}

export function normalizeTicks(ticks?: Ticks): Slice[] {
  if (ticks == null) return defaultSlices();

  if (typeof ticks === 'number') {
    const count = Math.trunc(ticks);
    if (!Number.isFinite(ticks) || count < 2) return defaultSlices();
    return Array.from({ length: count }, () => ({ weight: 1 }));
  }

  if (!Array.isArray(ticks) || ticks.length === 0) return defaultSlices();

  const slices = ticks.map((entry): Slice => {
    if (isDescriptor(entry)) {
      const weight = Number(entry.weight);
      return {
        weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        label: entry.label,
      };
    }
    const weight = Number(entry);
    return { weight: Number.isFinite(weight) && weight > 0 ? weight : 0 };
  });

  const total = slices.reduce((sum, slice) => sum + slice.weight, 0);
  return total > 0 ? slices : defaultSlices();
}

export function clampValue(value: number, totalSlices: number): number {
  const truncated = Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.min(Math.max(truncated, 0), totalSlices);
}

export function wrapValue(
  value: number,
  delta: number,
  totalSlices: number,
): number {
  const next = value + delta;
  if (next < 0) return totalSlices;
  if (next > totalSlices) return 0;
  return next;
}

/**
 * `value` counts completed slices rather than indexing them, so `value - 1`
 * identifies the active slice.
 */
export function resolveStepText(value: number, slices: Slice[]): string {
  const active = slices[value - 1];
  if (active?.label) return active.label;
  return `${value}/${slices.length}`;
}

export interface SlicePath {
  d: string;
  label?: string;
}

const START_ANGLE = -Math.PI / 2;
const FULL_TURN = Math.PI * 2;

function pointOnCircle(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): [number, number] {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

const FULL_TURN_EPSILON = 1e-9;

/**
 * Sweeps spanning a full turn draw two semicircular arcs through the opposite
 * point.
 */
function sliceArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  const [x1, y1] = pointOnCircle(cx, cy, radius, startAngle);

  if (sweep >= FULL_TURN - FULL_TURN_EPSILON) {
    const [xm, ym] = pointOnCircle(cx, cy, radius, startAngle + Math.PI);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${xm} ${ym} A ${radius} ${radius} 0 1 1 ${x1} ${y1} Z`;
  }

  const [x2, y2] = pointOnCircle(cx, cy, radius, endAngle);
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function buildSlicePaths(
  slices: Slice[],
  radius: number,
  center: number,
): SlicePath[] {
  const total = slices.reduce((sum, slice) => sum + slice.weight, 0);
  let angle = START_ANGLE;
  return slices.map((slice) => {
    const sweep = (slice.weight / total) * FULL_TURN;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return {
      d: sliceArcPath(center, center, radius, start, end),
      label: slice.label,
    };
  });
}
