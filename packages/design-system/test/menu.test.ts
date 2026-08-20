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
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnMenu from '../components/CnMenu.svelte';

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

/**
 * The trigger's three variants, read off the markup: which glyph it draws, which
 * presentation it takes, and which side the container opens toward. What the
 * side resolves to on screen is the browser's answer, and the chat bar's suite
 * asks it in place; what the component states is here.
 */
describe('the trigger variants', () => {
  const markup = (props: Record<string, unknown>) =>
    render(CnMenu, {
      props: {
        ...props,
        children: createRawSnippet(() => ({
          render: () => '<button type="button">Command</button>',
        })),
      },
    }).body;

  test('the glyph is the kebab by default and the dots inline', () => {
    expect(markup({})).toContain('kebab');
    expect(markup({ inline: true })).toContain('dots');
  });

  test('noun replaces the more-options glyph', () => {
    const html = markup({ noun: 'add' });
    expect(html).not.toContain('kebab');
    expect(html).toContain('add');
  });

  test('the trigger is the text button, and the chrome action with chrome', () => {
    expect(markup({})).toContain('class="text cn-menu-trigger"');
    expect(markup({ chrome: true })).toContain(
      'class="chrome-action cn-menu-trigger"',
    );
  });

  test('the container opens toward the block end, or the block start on request', () => {
    expect(markup({})).toContain('data-opens="block-end"');
    expect(markup({ opens: 'block-start' })).toContain(
      'data-opens="block-start"',
    );
  });
});

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
