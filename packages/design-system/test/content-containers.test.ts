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

/** The measure, in grid units, as the stylesheet declares it. */
const measureSteps = Number(
  css.match(/--cn-measure:\s*calc\(var\(--cn-grid\) \* (\d+)\)/)?.[1],
);

describe('the measure', () => {
  test('is not declared in the unit tokens', () => {
    // styles/units.css is asserted identical to the Cyan 4 file it shadows, and
    // the measure has no Cyan counterpart. Moving it there breaks units.test.ts.
    expect(units).not.toContain('--cn-measure');
  });

  test('is declared once, in grid units', () => {
    // Golden's primary is the same width as a prose flow by design. Two
    // declarations would let one of them drift.
    expect(measureSteps).toBe(83);
    expect(css.match(/--cn-measure:/g)).toHaveLength(1);
  });
});

/**
 * The wide composition of one mode: the condition it appears under, and its fixed
 * tracks in grid units. A track is either the measure or a count of grid steps.
 */
const wideMode = (mode: string) => {
  const block = [
    ...css.matchAll(/@container \(min-width: ([\d.]+)rem\) \{([\s\S]*?)\n\}/g),
  ].find((match) => match[2].includes(`${mode} {`));
  const template = (block?.[2] ?? '').match(/grid-template-columns:([^;]*);/);
  const tracks = [
    ...(template?.[1] ?? '').matchAll(
      /calc\(var\(--cn-grid\) \* (\d+)\)|var\((--cn-measure)\)/g,
    ),
  ].map((match) => (match[2] ? measureSteps : Number(match[1])));

  return { condition: Number(block?.[1]), tracks };
};

describe.each([
  { mode: '.content-triad', expected: [51, 32, 32] },
  { mode: '.content-golden', expected: [83, 32] },
])('the $mode threshold', ({ mode, expected }) => {
  const { condition, tracks } = wideMode(mode);

  test('equals the sum of its tracks and the gaps between them', () => {
    // The condition cannot read --cn-grid, so it is the one place the geometry is
    // written out. Derive it here rather than reading the literal back.
    expect(tracks).toEqual(expected);
    const gaps = 2 * (tracks.length - 1);
    const units = tracks.reduce((sum, track) => sum + track, 0) + gaps;

    expect(condition).toBe(units * 0.5);
  });
});

describe('scoping', () => {
  test('every rule sits below an opt-in class', () => {
    // A rule that escapes them reaches apps/pelilauta, which has not migrated
    // off Cyan's .content-columns.
    const optIn = [
      '.app-main',
      '.content-prose',
      '.content-triad',
      '.content-golden',
    ];
    // An at-rule prelude becomes a closing brace, so the selectors nested inside
    // it are scanned too rather than silently skipped.
    const flattened = css.replace(/@[\w-]+[^{};]*\{/g, '}');
    const rules = [...flattened.matchAll(/(^|[};])\s*([^{}@]+?)\s*\{/g)].map(
      (m) => m[2].replace(/\s+/g, ' ').trim(),
    );

    expect(rules.length).toBeGreaterThan(0);
    for (const selector of rules) {
      expect(
        optIn.some((name) => selector.includes(name)),
        `${selector} escapes ${optIn.join(' and ')}`,
      ).toBe(true);
    }
  });
});
