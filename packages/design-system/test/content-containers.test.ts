/*
 * Contract tests for the content containers.
 *
 * These cover the guardrails a stylesheet can be read for. The behavioural
 * scenarios need a rendered page and live in apps/design/e2e.
 *
 * Spec: specs/design-system/content-container-layouts/spec.md
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
    expect(expression).toContain(
      'min(var(--cn-measure), 100% - 2 * var(--cn-gap))',
    );
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
    const rules = [...css.matchAll(/(^|[};])\s*([^{}@]+?)\s*\{/g)].map((m) =>
      m[2].replace(/\s+/g, ' ').trim(),
    );

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
    // A section is the column; an article spans the page for breakouts, so the
    // container moves to its column-width blocks.
    const section = css.match(/\.cn-app-main > section\s*\{([^}]*)\}/);
    expect(section, 'the section container is not declared').not.toBeNull();
    expect(section?.[1]).toMatch(/container:\s*cn-content\s*\/\s*inline-size/);
    expect(section?.[1]).not.toMatch(/(inline-size|width)\s*:/);

    const blocks = css.match(/\.cn-app-main > article > \*\s*\{([^}]*)\}/);
    expect(blocks, "the article's blocks are not containers").not.toBeNull();
    expect(blocks?.[1]).toMatch(/container:\s*cn-content\s*\/\s*inline-size/);
    expect(blocks?.[1]).toMatch(/grid-column:\s*2/);
  });

  test('a breakout block takes its own width, centred, and stops being a container', () => {
    const breakout = css.match(
      /\.cn-app-main > article > \.cn-breakout\s*\{([^}]*)\}/,
    );
    expect(breakout, 'cn-breakout is not declared').not.toBeNull();
    expect(breakout?.[1]).toMatch(/grid-column:\s*1 \/ -1/);
    expect(breakout?.[1]).toMatch(/justify-self:\s*center/);
    expect(breakout?.[1]).toMatch(/max-inline-size:\s*100%/);
    // Its width is its content's: a full-span container would report the page.
    expect(breakout?.[1]).toMatch(/container:\s*none/);
  });
});
