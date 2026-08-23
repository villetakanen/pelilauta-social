/**
 * What the menu resolves to is asserted against the rendered book in
 * apps/design/e2e/cn-menu.spec.ts; what the component states is here.
 */
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnMenu from '../components/CnMenu.svelte';

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
