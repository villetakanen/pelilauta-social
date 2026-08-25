/*
 * Contract tests for the content containers.
 *
 * These cover the guardrails a stylesheet can be read for. The behavioural
 * scenarios need a rendered page and live in apps/design/e2e.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { parseTokens, unitDeclarations } from '../books/specimens/tokenTable';
import units from '../tokens/units.json';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

/** Source with comments removed, so a commented example never counts as a rule. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '');

const css = withoutComments(read('../styles/content-containers.css'));

/**
 * The measure, in grid units, as the spatial tokens declare it. It is a length
 * on the grid, so specs/design-system/spatial-system/spec.md carries it and
 * these containers read it; the value is asserted here because the wide-mode
 * thresholds below are derived from it.
 */
const measureSteps = Number(
  parseTokens(unitDeclarations(units), {
    names: ['--cn-measure'],
  })[0]?.value.match(/calc\(var\(--cn-grid\) \* (\d+)\)/)?.[1],
);

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
    const optIn = ['.content-prose', '.content-triad', '.content-golden'];
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
