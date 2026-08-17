/**
 * The two chip guarantees a browser cannot be asked about.
 *
 * Everything the chip resolves to is asserted against the rendered book in
 * apps/design/e2e/chip.spec.ts. These two are claims about what the stylesheet
 * declares, which a computed style cannot separate from what it inherited:
 *
 * - `.chip-list` is the row wrapper and nothing else. A resolved padding or
 *   colour on a flex container is indistinguishable from an inherited one, so the
 *   declarations are read from the source.
 * - `!important` wins over a rule Cyan cannot outrank either, so a chip that beat
 *   Cyan by weight would pass every rendered check while hiding that the import
 *   order stopped working.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const SOURCE = readFileSync(
  fileURLToPath(new URL('../styles/chip.css', import.meta.url)),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

/** Every rule in the stylesheet, selector and declaration block apart. */
const rules = [...SOURCE.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: match[1].replace(/\s+/g, ' ').trim(),
  body: match[2],
}));

describe('chip presentation', () => {
  test('the chip row declares layout and gap, and nothing else', () => {
    const allowed = new Set([
      'display',
      'flex',
      'flex-wrap',
      'flex-direction',
      'align-items',
      'justify-content',
      'gap',
      'row-gap',
      'column-gap',
    ]);

    const list = rules.filter((rule) => rule.selector.startsWith('.chip-list'));
    expect(list.length).toBeGreaterThan(0);

    const declared = list.flatMap((rule) =>
      rule.body
        .split(';')
        .map((declaration) => declaration.split(':')[0].trim())
        .filter(Boolean),
    );

    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((property) => !allowed.has(property))).toEqual([]);
  });

  test('no chip rule carries !important', () => {
    expect(SOURCE).not.toContain('!important');
  });
});
