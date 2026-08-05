/**
 * Colour resolution and contrast.
 *
 * The palette is OKLCH and the semantic layer states both themes in one
 * `light-dark()` declaration, so a contrast figure appears in no stylesheet. It
 * has to be computed per theme, after the `var()` chain is resolved.
 *
 * Contrast guardrails are computed from the current semantic assignments rather
 * than copied from a reference pair in prose.
 *
 * Books: apps/design/src/content/tokens/color.mdx
 *        apps/design/src/content/principles/color-system.mdx
 * Spec:  specs/design-system/design-tokens/spec.md
 */
import { parseTokens } from './tokenTable';

export type Mode = 'light' | 'dark';

/** An OKLCH triplet as declared: lightness 0–1, chroma, hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Split on commas at depth zero, so nested functions stay intact. */
function topLevelArgs(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of inner) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function parseOklch(value: string): Oklch | undefined {
  const match = value.trim().match(/^oklch\(\s*([^)]+)\)$/i);
  if (!match) return undefined;
  const [l, c, h] = match[1].trim().split(/\s+/).map(Number);
  if ([l, c, h].some(Number.isNaN)) return undefined;
  return { l, c, h };
}

/** The two CSS colour keywords the semantic layer states literally. */
const KEYWORDS: Record<string, Oklch> = {
  black: { l: 0, c: 0, h: 0 },
  white: { l: 1, c: 0, h: 0 },
};

/**
 * Resolve a declared value to a colour for one theme, following `var()` chains
 * and picking the matching arm of any `light-dark()`.
 *
 * Returns undefined for anything it cannot resolve: `color-mix()`, gradients, a
 * token defined elsewhere. Callers that require a colour check for undefined.
 */
export function resolve(
  value: string,
  mode: Mode,
  tokens: Map<string, string>,
  seen = new Set<string>(),
): Oklch | undefined {
  const trimmed = value.trim();

  const keyword = KEYWORDS[trimmed.toLowerCase()];
  if (keyword) return keyword;

  const literal = parseOklch(trimmed);
  if (literal) return literal;

  const lightDark = trimmed.match(/^light-dark\(\s*([\s\S]+)\)$/i);
  if (lightDark) {
    const args = topLevelArgs(lightDark[1]);
    if (args.length !== 2) return undefined;
    return resolve(mode === 'light' ? args[0] : args[1], mode, tokens, seen);
  }

  const variable = trimmed.match(/^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/);
  if (variable) {
    const name = variable[1];
    if (seen.has(name)) return undefined;
    const next = tokens.get(name);
    if (next === undefined) {
      return variable[2] ? resolve(variable[2], mode, tokens, seen) : undefined;
    }
    return resolve(next, mode, tokens, new Set([...seen, name]));
  }

  return undefined;
}

/** OKLCH to gamma-encoded sRGB, clamped into gamut. */
export function toSrgb({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);

  const lCubed = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCubed = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCubed = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed,
    -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed,
    -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed,
  ];

  return linear.map((channel) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  }) as [number, number, number];
}

/** WCAG 2.1 relative luminance. */
export function luminance(color: Oklch): number {
  const [r, g, b] = toSrgb(color).map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, 1–21. */
export function contrast(a: Oklch, b: Oklch): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

export type Grade = 'AA' | 'AA Large' | 'Fail';

/** WCAG 2.1 grade for body text at normal size. */
export function grade(ratio: number): Grade {
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

/** Every declaration across the given stylesheets, as name -> declared value. */
export function tokenMap(...sources: string[]): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const source of sources) {
    for (const { name, value } of parseTokens(source)) tokens.set(name, value);
  }
  return tokens;
}

export interface Measurement {
  foreground: string;
  background: string;
  mode: Mode;
  ratio: number;
  grade: Grade;
}

/**
 * Measure one foreground token against one background token in one theme.
 * Throws when either side cannot be resolved, so a broken reference fails the
 * build instead of shortening a published table.
 */
export function measure(
  foreground: string,
  background: string,
  mode: Mode,
  tokens: Map<string, string>,
): Measurement {
  const front = resolve(`var(${foreground})`, mode, tokens);
  const back = resolve(`var(${background})`, mode, tokens);
  if (!front || !back) {
    throw new Error(
      `Cannot resolve ${!front ? foreground : background} in ${mode} mode.`,
    );
  }
  const ratio = contrast(front, back);
  return { foreground, background, mode, ratio, grade: grade(ratio) };
}
