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

/** Every balanced `color-mix(...)` call, with its full argument text. */
function colorMixCalls(source: string): string[] {
  const calls: string[] = [];
  for (const match of source.matchAll(/color-mix\(/g)) {
    let depth = 1;
    let index = (match.index ?? 0) + match[0].length;
    let inner = '';
    while (index < source.length && depth > 0) {
      const char = source[index];
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth > 0) inner += char;
      index++;
    }
    calls.push(inner);
  }
  return calls;
}

describe('surface cession', () => {
  // The regression this guards: a ceded share written as a raw percentage
  // (`transparent 20%`) instead of a rung of the transparency ladder
  // (`var(--cn-transparency-2)`), which is exactly the defect that predated
  // the ladder and the one it exists to prevent from returning. Scoped to
  // color-mix() calls, so the unrelated `transparent 95%` mask-image stop
  // that dissolves the poster's lower edge is not mistaken for a share.
  const mixes = colorMixCalls(css);

  test('at least one rule cedes a share', () => {
    expect(mixes.length).toBeGreaterThan(0);
  });

  test('every ceded share is a transparency-ladder rung, never a raw percentage', () => {
    const offenders = mixes.filter(
      (mix) => !/transparent\s+var\(--cn-transparency-[\w-]+\)/.test(mix),
    );

    expect(offenders).toEqual([]);
  });

  test('elevation 0 cedes the wide share and elevations 1 and 2 the narrow share', () => {
    const shareFor = (selector: string) => {
      const rule = css.match(
        new RegExp(
          `body:has\\(#cn-poster\\)\\s+${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`,
        ),
      );
      return rule?.[1].match(/var\(--cn-transparency-[\w-]+\)/)?.[0];
    };

    expect(shareFor('.elevation-0')).toBe('var(--cn-transparency-6)');
    expect(shareFor('.elevation-1')).toBe('var(--cn-transparency-2)');
    expect(shareFor('.elevation-2')).toBe('var(--cn-transparency-2)');
  });

  test('elevations 3 and 4 keep no cession rule', () => {
    expect(css).not.toMatch(/\.elevation-3\s*\{[^}]*color-mix/);
    expect(css).not.toMatch(/\.elevation-4\s*\{[^}]*color-mix/);
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
