/**
 * forms.css leaves one fact for a rendered page to decide: whether a
 * legend's h3 treatment shares a selector with typography.css, or copies its
 * values beside it. Both render identically today. Only sharing the selector
 * keeps them from drifting apart tomorrow. `apps/design/e2e/forms.spec.ts`
 * covers what a browser resolves for the fieldset and legend geometry.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const STYLES = fileURLToPath(new URL('../styles', import.meta.url));

/** Source with comments removed, so prose about a rule never counts as one. */
function withoutComments(source: string) {
  return readFileSync(join(STYLES, source), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

/**
 * Splits a selector list on its top-level commas. `:not(.a, .b)` carries a
 * comma too, so this function tracks nesting depth instead of splitting the
 * string naively.
 */
function compounds(selector: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of selector) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      found.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }
  found.push(current.trim());
  return found;
}

/** Rules of a stylesheet, as parsed selector-list/body pairs. */
function rules(source: string) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: compounds(match[1].replace(/\s+/g, ' ').trim()),
    body: match[2],
  }));
}

describe('the legend type treatment', () => {
  test('legend shares the h3 selector list, at rest and under the downshift', () => {
    const typography = withoutComments('typography.css');
    const h3Rules = rules(typography).filter((rule) =>
      rule.selectors.includes('h3'),
    );

    expect(h3Rules.length).toBeGreaterThanOrEqual(2);
    for (const rule of h3Rules) {
      expect(rule.selectors).toContain('legend');
    }
  });

  test('forms.css states no size, line, weight or colour of its own for legend', () => {
    const forms = withoutComments('forms.css');
    const legendRule = rules(forms).find((rule) =>
      rule.selectors.includes('legend'),
    );

    expect(legendRule).toBeTruthy();
    for (const property of [
      'font-size',
      'font-weight',
      'line-height',
      'letter-spacing',
      'color',
    ]) {
      expect(legendRule?.body).not.toContain(property);
    }
  });
});
