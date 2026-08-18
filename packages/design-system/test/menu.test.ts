/**
 * The two menu guarantees a browser cannot be asked about.
 *
 * What the menu resolves to is asserted against the rendered book in
 * apps/design/e2e/cn-menu.spec.ts. These two are claims about what the
 * stylesheets declare, which a computed style cannot separate from what another
 * rule supplied:
 *
 * - The trigger is the system text icon button. A computed background on it
 *   matches whether buttons.css painted it or menu.css restated the same value,
 *   so the guarantee is that menu.css declares nothing on the trigger but the
 *   anchor.
 * - An item is excluded from the button presentation rather than overriding it.
 *   A row that won by weight would pass every rendered check while leaving the
 *   button's geometry, gradient and elevation one specificity change away from
 *   coming back.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );

/** Every rule in a stylesheet, selector and declaration block apart. */
const parse = (source: string) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].replace(/\s+/g, ' ').trim(),
    body: match[2],
  }));

describe('menu presentation', () => {
  test('the trigger takes the anchor from the menu and everything else from the button', () => {
    const rules = parse(read('../styles/menu.css')).filter((rule) =>
      rule.selector.includes('.cn-menu-trigger'),
    );
    expect(rules.length).toBeGreaterThan(0);

    const declared = rules.flatMap((rule) =>
      rule.body
        .split(';')
        .map((declaration) => declaration.split(':')[0].trim())
        .filter(Boolean),
    );

    expect(declared).toEqual(['anchor-name']);
  });

  test('every button rule that excludes a chip excludes a menu item too', () => {
    const excluding = parse(read('../styles/buttons.css')).filter((rule) =>
      rule.selector.includes('.chip *'),
    );
    expect(excluding.length).toBeGreaterThan(0);

    expect(
      excluding
        .map((rule) => rule.selector)
        .filter((selector) => !selector.includes('.cn-menu-container *')),
    ).toEqual([]);
  });
});
