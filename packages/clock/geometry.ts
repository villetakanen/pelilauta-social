/**
 * Clock's pure geometry: normalising `ticks` into a slice array, clamping
 * `value`, resolving the announced step text, and building each slice's SVG
 * path. None of it touches the DOM, so a plain Node suite can assert every
 * shape `specs/clock/spec.md` admits, including the ones that would otherwise
 * only surface as a rendered NaN.
 */

/** One slice's declared shape, before normalising against its siblings. */
export interface SliceDescriptor {
  weight?: number;
  label?: string;
}

/** The three forms `ticks` accepts: a count, relative weights, or descriptors. */
export type Ticks = number | number[] | SliceDescriptor[];

/** A normalised slice: always a positive weight, optionally a label. */
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

/**
 * Resolves `ticks` into slices with a positive weight each. Any input the
 * spec calls invalid — omitted, empty, a non-integer or sub-2 count, a
 * zero-weight total — falls back to 4 equal slices rather than propagating
 * toward a zero-weight geometry.
 */
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

/**
 * Casts `value` the way the spec states: truncate toward zero, resolve a
 * non-finite input to 0, then clamp to the slice count on both ends.
 */
export function clampValue(value: number, totalSlices: number): number {
  const truncated = Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.min(Math.max(truncated, 0), totalSlices);
}

/**
 * Applies one step and wraps at both boundaries: past the top end, the value
 * returns to 0; below 0, it returns to the slice count.
 */
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
 * The active slice is the last completed one — index `value - 1` — because a
 * step label names the stage the reader just reached, not the one ahead.
 * Absent a label, the fraction is the language-neutral fallback.
 */
export function resolveStepText(value: number, slices: Slice[]): string {
  const active = slices[value - 1];
  if (active?.label) return active.label;
  return `${value}/${slices.length}`;
}

/** One slice's rendered path, alongside the label its arc represents. */
export interface SlicePath {
  d: string;
  label?: string;
}

const START_ANGLE = -Math.PI / 2; // 12 o'clock; angle increases clockwise from here.
const FULL_TURN = Math.PI * 2;

function pointOnCircle(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): [number, number] {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

// SVG's arc command cannot express a full turn: it identifies an arc by its
// endpoints, so a start and end angle 2π apart describe the same point twice,
// and the renderer treats that as a zero-length arc rather than a circle. A
// single weight carrying the whole total (`ticks={[1]}`, or any array where
// every other weight is 0) produces exactly this sweep, so it is handled by
// splitting the turn rather than by hoping trig round-off keeps the two
// angles distinct.
const FULL_TURN_EPSILON = 1e-9;

/**
 * One slice's pie-wedge path, as a triangle-ish `M L A Z`: centre out to the
 * start radius, an arc to the end radius, straight back to centre. The large-
 * arc flag only trips past a half turn; the sweep flag is fixed at 1 because
 * every slice here runs clockwise.
 *
 * A sweep at or past a full turn instead draws two semicircle arcs through
 * the point diametrically opposite the start — a genuine closed disc whose
 * two endpoints are computed independently, rather than one arc whose start
 * and end are the same angle carried through `cos`/`sin` twice and left to
 * land a floating-point epsilon apart.
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

/**
 * Builds every slice's path around one circle, proportioning each arc to its
 * weight against the total. `normalizeTicks` guarantees a positive total, so
 * this never divides by zero.
 */
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
