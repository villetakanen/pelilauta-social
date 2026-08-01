/*
 * Contract tests for the content containers.
 *
 * These cover the guardrails a stylesheet can be read for. The behavioural
 * scenarios need a rendered page and live in apps/design/e2e.
 *
 * Spec: specs/design-system/content-containers/spec.md
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

/** Source with comments removed, so a commented example never counts as a rule. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '');

const css = withoutComments(read('../styles/content-containers.css'));
const units = withoutComments(read('../styles/units.css'));

describe('the measure', () => {
  test('is declared as a whole number of grid steps', () => {
    const declaration = css.match(/--cn-measure\s*:\s*([^;]+);/);
    expect(declaration, '--cn-measure is not declared').not.toBeNull();

    const steps = declaration?.[1].match(
      /calc\(\s*var\(\s*--cn-grid\s*\)\s*\*\s*([\d.]+)\s*\)/,
    );
    expect(steps, '--cn-measure is not a --cn-grid multiple').not.toBeNull();
    expect(Number.isInteger(Number(steps?.[1]))).toBe(true);
  });

  test('is not declared in the unit tokens', () => {
    // styles/units.css is asserted identical to the Cyan 4 file it shadows, and
    // the measure has no Cyan counterpart. Moving it there breaks units.test.ts.
    expect(units).not.toContain('--cn-measure');
  });
});

describe('the two modes', () => {
  test('are one track expression, so no threshold can drift out of step', () => {
    // The narrow term and the measure meet exactly where they are equal. Split
    // into a query and a literal breakpoint, the two could disagree and the
    // content would jump; as one min() they cannot.
    const track = css.match(/grid-template-columns:\s*([^;]+);/);
    expect(track, 'no grid track expression found').not.toBeNull();

    const expression = track?.[1].replace(/\s+/g, ' ') ?? '';
    expect(expression).toContain('min(var(--cn-measure), 100% - 2 * var(--cn-gap))');
  });

  test('need no container query at all', () => {
    expect(css).not.toContain('@container');
  });

  test('state no pixel length', () => {
    expect(css).not.toMatch(/[\d.]+px/);
  });
});

describe('scoping', () => {
  test('every rule sits below the opt-in class', () => {
    // A rule that escapes the class reaches apps/pelilauta, which has not
    // migrated off Cyan's .content-columns.
    const rules = [...css.matchAll(/(^|[};])\s*([^{}@]+?)\s*\{/g)]
      .map((m) => m[2].replace(/\s+/g, ' ').trim())
      .filter((selector) => selector !== ':root');

    expect(rules.length).toBeGreaterThan(0);
    for (const selector of rules) {
      expect(selector, `${selector} escapes .cn-app-main`).toContain(
        '.cn-app-main',
      );
    }
  });

  test('the container element is the column, not the page', () => {
    // container-type reports the element's own border box. Declaring cn-content
    // on a full-width element would report the page, and every query written
    // against it would be answered with 30rem more room than the column has.
    const container = css.match(
      /\.cn-app-main > section,\s*\.cn-app-main > article\s*\{([^}]*)\}/,
    );
    expect(container, 'containers are not declared as expected').not.toBeNull();
    expect(container?.[1]).toMatch(/container:\s*cn-content\s*\/\s*inline-size/);
    expect(container?.[1]).not.toMatch(/(inline-size|width)\s*:/);
  });
});
