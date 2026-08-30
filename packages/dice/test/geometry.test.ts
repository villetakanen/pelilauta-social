/**
 * Geometry pin for Dice's silhouettes against `cn-dice`, the standalone Lit
 * element this package ports (see `styles/dice.css`'s header comment and
 * `specs/dice/spec.md`). Dice was first built from the spec alone, without
 * reading `cn-dice`'s source, and the shapes came out wrong — the wrong
 * `d10` waist, a hand-made `d20`, a rounded `d6`. This suite pins the
 * per-die `clip-path` polygon (or its absence), the shape's size as a
 * percentage of the die box, and its rotation to upstream's `static styles`
 * block, so a future edit that drifts from `cn-dice`'s geometry fails here
 * rather than passing silently.
 *
 * Upstream expresses shape size as `height: Xcqi` against a container query
 * on the host; this package has no host to query, so it expresses the same
 * ratio as `height: X%` of `.dice`'s own box. The percentage figures below
 * are that direct, unit-for-unit translation — 90cqi ports to 90%, and so
 * on — not a re-derivation.
 *
 * d2 has no upstream counterpart: `cn-dice` has no two-sided die. It is
 * this port's own addition and is asserted only for its own consistency
 * (a circle, the shared base rotation), not against an upstream shape.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const diceCss = readFileSync(join(packageRoot, 'styles', 'dice.css'), 'utf8');

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The declaration block for a given `::before` selector, comments stripped. */
function ruleFor(selector: string): string {
  const stripped = stripComments(diceCss);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stripped.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No rule found for selector: ${selector}`);
  return match[1];
}

/** The shared base rule every silhouette starts from. */
const base = ruleFor('.dice::before');

describe('the base silhouette rule carries the shared rotation and square ratio', () => {
  test('rotate(2.25deg), the base every die but d20 keeps', () => {
    expect(base).toMatch(/transform\s*:\s*rotate\(2\.25deg\)/);
  });

  test('aspect-ratio: 1, the default cn-dice square', () => {
    expect(base).toMatch(/aspect-ratio\s*:\s*1\s*;/);
  });
});

interface Pin {
  sides: number;
  /** The upstream `cqi` height, ported 1:1 to a `%` of the die box. */
  height: string;
  /** The exact upstream clip-path, or null where upstream clips nothing. */
  clipPath: string | null;
  /** True only for d20, which overrides the base rotation. */
  ownRotation?: string;
}

/**
 * Upstream's `static styles` in `cn-dice.ts`, one entry per die
 * `cn-dice` renders. Geometry — the polygon points, the height, the
 * rotation — is transcribed verbatim; only `cqi` becomes `%`.
 */
const PINS: Pin[] = [
  {
    sides: 4,
    height: '90%',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  },
  {
    sides: 6,
    height: '80%',
    clipPath: null,
  },
  {
    sides: 8,
    height: '100%',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  },
  {
    sides: 10,
    height: '95%',
    clipPath: 'polygon(50% 0%, 95% 40%, 95% 60%, 50% 100%, 5% 60%, 5% 40%)',
  },
  {
    sides: 12,
    height: '100%',
    clipPath:
      'polygon(34.54915% 2.44717%, 65.45085% 2.44717%, 90.45085% 20.61074%, 100% 50%, 90.45085% 79.38926%, 65.45085% 97.55283%, 34.54915% 97.55283%, 9.54915% 79.38926%, 0% 50%, 9.54915% 20.61074%)',
  },
  {
    sides: 20,
    height: '90%',
    clipPath: 'polygon(50% -50%, 100% 50%, 50% 150%, 0 50%)',
    ownRotation: 'rotate(35deg)',
  },
];

describe('every ported silhouette matches cn-dice geometry', () => {
  for (const pin of PINS) {
    const rule = ruleFor(`.dice[data-sides="${pin.sides}"]::before`);

    test(`d${pin.sides} — height ${pin.height} of the box`, () => {
      expect(rule).toMatch(new RegExp(`height\\s*:\\s*${pin.height}`));
    });

    if (pin.clipPath === null) {
      test(`d${pin.sides} — no clip-path`, () => {
        expect(rule).not.toMatch(/clip-path\s*:/);
      });
    } else {
      test(`d${pin.sides} — clip-path matches upstream's polygon`, () => {
        const normalize = (css: string) =>
          css
            .replace(/\s+/g, ' ')
            .replace(/,\s*/g, ', ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .trim();
        const clipMatch = rule.match(/clip-path\s*:\s*([^;]+);/);
        expect(clipMatch).not.toBeNull();
        expect(normalize(clipMatch?.[1] ?? '')).toBe(
          normalize(pin.clipPath as string),
        );
      });
    }

    if (pin.ownRotation) {
      const escaped = pin.ownRotation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      test(`d${pin.sides} — overrides the base rotation with ${pin.ownRotation}`, () => {
        expect(rule).toMatch(new RegExp(`transform\\s*:\\s*${escaped}`));
      });
    } else {
      test(`d${pin.sides} — does not override the base rotation`, () => {
        expect(rule).not.toMatch(/transform\s*:/);
      });
    }
  }

  test('d20 — the equilateral-triangle aspect ratio, matching upstream', () => {
    const rule = ruleFor('.dice[data-sides="20"]::before');
    expect(rule).toMatch(/aspect-ratio\s*:\s*1\s*\/\s*cos\(30deg\)/);
  });
});

describe("d2, this port's own addition, has no upstream shape to pin", () => {
  const rule = ruleFor('.dice[data-sides="2"]::before');

  test('a circle, via border-radius: 50%', () => {
    expect(rule).toMatch(/border-radius\s*:\s*50%/);
  });

  test('does not override the shared base rotation', () => {
    expect(rule).not.toMatch(/transform\s*:/);
  });
});
