/**
 * The `.actions` guarantees a browser cannot be asked about.
 *
 * A rendered page reports `margin: 0` on an unstyled div too, so the spec's "no
 * outer margin" claim only distinguishes the rule from an accident when the rule
 * itself is read. The absence of an `overflow` declaration is the same kind of
 * claim: a computed `visible` is also what a div reports when nobody decided, and
 * here it was decided. The block size and gap are asserted as the token expressions they
 * are written against, not the lengths they resolve to, and the cascade winner
 * between `.actions` and the sortable list's row is import order in
 * `styles/ds.css`, which no computed style discloses. Everything else — where
 * the row is centred, where each modifier puts its controls, whether the row
 * wraps — is a computed geometry fact and lives in
 * apps/design/e2e/actions-container.spec.ts instead.
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

/** The rules of one stylesheet, as selector/body pairs in source order. */
function rules(source: string) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].replace(/\s+/g, ' ').trim(),
    body: match[2],
  }));
}

describe('actions container', () => {
  const buttons = withoutComments('buttons.css');
  const actions = rules(buttons).find((rule) => rule.selector === '.actions');

  test('applies no outer margin', () => {
    expect(actions?.body).toMatch(/margin:\s*0\s*;/);
  });

  test('never wraps', () => {
    expect(actions?.body).toMatch(/flex-wrap:\s*nowrap\s*;/);
  });

  test('declares no overflow, so nothing in the row is hidden', () => {
    expect(actions?.body).not.toMatch(/overflow/);
  });

  test('the block size is six grid units, on the token', () => {
    expect(actions?.body).toMatch(
      /block-size:\s*calc\(var\(--cn-grid\) \* 6\)\s*;/,
    );
  });

  test('the gap is the shared gap token, not a literal', () => {
    expect(actions?.body).toMatch(/gap:\s*var\(--cn-gap\)\s*;/);
  });

  test('exactly the three named alignment modifiers exist', () => {
    const modifiers = rules(buttons).filter((rule) =>
      /^\.actions\.justify-/.test(rule.selector),
    );
    const byModifier = Object.fromEntries(
      modifiers.map((rule) => [rule.selector, rule.body]),
    );

    expect(Object.keys(byModifier).sort()).toEqual([
      '.actions.justify-center',
      '.actions.justify-end',
      '.actions.justify-start',
    ]);
    expect(byModifier['.actions.justify-start']).toMatch(
      /justify-content:\s*flex-start\s*;/,
    );
    expect(byModifier['.actions.justify-end']).toMatch(
      /justify-content:\s*flex-end\s*;/,
    );
    expect(byModifier['.actions.justify-center']).toMatch(
      /justify-content:\s*center\s*;/,
    );
  });

  test('buttons.css imports before sortable-list.css, so the component override keeps winning', () => {
    const ds = readFileSync(join(STYLES, 'ds.css'), 'utf8');
    const buttonsImport = ds.indexOf('@import "./buttons.css"');
    const sortableListImport = ds.indexOf('@import "./sortable-list.css"');

    expect(buttonsImport).toBeGreaterThan(-1);
    expect(sortableListImport).toBeGreaterThan(-1);
    expect(buttonsImport).toBeLessThan(sortableListImport);
  });
});
