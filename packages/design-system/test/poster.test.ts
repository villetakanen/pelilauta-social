/*
 * Contract tests for the poster stylesheet's media structure.
 *
 * The stage shows the poster and may state only baseline features; the
 * withdrawals hide it and alone may state the accessibility preferences. An
 * unknown media feature evaluates its whole query false, so a preference
 * folded back into the stage's guard would erase the poster from every
 * browser that cannot parse it — Safari knows neither feature — while a
 * preference in a withdrawal fails toward the plain poster. The split is
 * invisible in a supporting browser, which is why it needs a pin.
 *
 * Spec: specs/design-system/components/cn-poster/spec.md
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

/** Source with comments removed, so a commented example never counts as a rule. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '');

const css = withoutComments(read('../styles/poster.css'));

const preludes = [...css.matchAll(/@media\s+([^{]+)\{/g)].map((match) =>
  match[1].replace(/\s+/g, ' ').trim(),
);

const stage = preludes.filter((prelude) => prelude.includes('min-width'));
const withdrawals = preludes.filter(
  (prelude) => !prelude.includes('min-width'),
);

describe('the stage', () => {
  test('is one block, guarded by baseline features alone', () => {
    expect(stage).toEqual(['screen and (min-width: 38.75rem)']);
  });
});

describe('the withdrawals', () => {
  test('alone state the accessibility preferences', () => {
    expect(withdrawals).toEqual([
      '(prefers-reduced-transparency: reduce), (forced-colors: active)',
    ]);
  });

  test('follow the stage, so they win on source order', () => {
    expect(css.indexOf('min-width')).toBeLessThan(
      css.indexOf('prefers-reduced-transparency'),
    );
  });
});
