/**
 * Regression guard for the clipped-glyph defect: `clip-path` on `.dice`
 * itself clips every descendant, `::before` included, so a silhouette
 * declared on the element would cut its own glyph — the glyph being
 * `.dice`'s own text content (a real, selectable text node; see the
 * stylesheet's header comment for why it is no longer generated content).
 *
 * vitest runs in Node here — there is no browser layout engine, so this
 * suite cannot measure where the glyph actually paints relative to a
 * clipped silhouette or a negative-z-index one. What it can do, and does,
 * is assert the structural rules that prevent the defect: every `clip-path`
 * (and the `border-radius` silhouettes use the same way) is declared on
 * `::before` alone, never on the bare element; and `::before` sits at a
 * negative stack level within `.dice`'s own isolated stacking context, so
 * the element's own in-flow text — which cannot carry a `z-index` of its
 * own — paints above it. A real rendered-geometry check — confirming the
 * glyph pixels are not cut, and that they paint above the silhouette —
 * needs a browser and is outside what this suite can carry.
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

/** Every rule block as { selector, body }, comments already stripped. */
function rules(source: string): Array<{ selector: string; body: string }> {
  const stripped = stripComments(source);
  const found: Array<{ selector: string; body: string }> = [];
  for (const match of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    found.push({ selector: match[1].trim(), body: match[2] });
  }
  return found;
}

const parsedRules = rules(diceCss);

describe('no shape-clipping property reaches the element itself', () => {
  const shapeClippingRules = parsedRules.filter(
    (rule) =>
      /clip-path\s*:/.test(rule.body) || /border-radius\s*:/.test(rule.body),
  );

  test('every rule that clips or rounds a silhouette targets ::before', () => {
    expect(shapeClippingRules.length).toBeGreaterThan(0);
    const offenders = shapeClippingRules.filter(
      (rule) => !rule.selector.includes('::before'),
    );
    expect(offenders.map((rule) => rule.selector)).toEqual([]);
  });

  test('no clip-path or border-radius is declared on .dice without ::before', () => {
    const bareElementRules = parsedRules.filter(
      (rule) =>
        /(^|,)\s*\.dice(\[[^\]]*\])*\s*(,|$)/.test(rule.selector) &&
        !rule.selector.includes('::'),
    );
    for (const rule of bareElementRules) {
      expect(rule.body).not.toMatch(/clip-path\s*:/);
      expect(rule.body).not.toMatch(/border-radius\s*:/);
    }
  });
});

describe('the face value is a real text node, never generated content', () => {
  test('no rule draws content via attr(data-value)', () => {
    for (const rule of parsedRules) {
      expect(rule.body).not.toMatch(/content\s*:\s*attr\(\s*data-value/);
    }
  });

  test('no rule forbids selecting the text', () => {
    for (const rule of parsedRules) {
      expect(rule.body).not.toMatch(/user-select\s*:\s*none/);
    }
  });

  test('there is no ::after rule left to carry generated content', () => {
    const afterRules = parsedRules.filter((rule) =>
      rule.selector.includes('::after'),
    );
    expect(afterRules).toEqual([]);
  });
});

describe('the silhouette is isolated on a positioned ::before, below the text', () => {
  test('.dice::before is taken out of flow', () => {
    const before = parsedRules.find(
      (rule) => rule.selector === '.dice::before',
    );
    expect(before).toBeDefined();
    expect(before?.body).toMatch(/position\s*:\s*absolute/);
  });

  test('.dice::before sits at a negative stack level', () => {
    const before = parsedRules.find(
      (rule) => rule.selector === '.dice::before',
    );
    expect(before?.body).toMatch(/z-index\s*:\s*-1/);
  });

  test('.dice establishes its own stacking context, so the negative z-index stays scoped to it', () => {
    const dice = parsedRules.find((rule) => rule.selector === '.dice');
    expect(dice).toBeDefined();
    expect(dice?.body).toMatch(/isolation\s*:\s*isolate/);
  });
});
