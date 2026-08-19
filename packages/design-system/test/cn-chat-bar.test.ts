import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnChatBar from '../components/CnChatBar.svelte';

/**
 * What the markup and the component's own stylesheet carry: the accessible
 * name, the disabled state reaching the field and the supplied actions, the
 * consumer's placeholder and value, and which regions render. Enter, Shift+
 * Enter, composition and the responsive geometry are behaviour over a live
 * DOM, and apps/design/e2e/cn-chat-bar.spec.ts drives those in a browser.
 */
const snippet = (html: string) =>
  createRawSnippet(() => ({ render: () => html }));

const markup = (props: {
  value?: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  supporting?: string;
  leading?: string;
  trailing?: string;
}) =>
  render(CnChatBar, {
    props: {
      ...props,
      supporting: props.supporting ? snippet(props.supporting) : undefined,
      leading: props.leading ? snippet(props.leading) : undefined,
      trailing: props.trailing ? snippet(props.trailing) : undefined,
    },
  }).body;

describe('the accessible name', () => {
  test('the textarea takes its name from label', () => {
    const html = markup({ label: 'Vastaa ketjuun' });
    expect(html).toContain('aria-label="Vastaa ketjuun"');
  });

  test('the placeholder does not carry the accessible name', () => {
    const html = markup({
      label: 'Vastaa ketjuun',
      placeholder: 'Kirjoita viesti',
    });
    expect(html).toContain('aria-label="Vastaa ketjuun"');
    expect(html).not.toContain('aria-label="Kirjoita viesti"');
  });
});

describe('the consumer-supplied content', () => {
  test('the placeholder renders on the textarea', () => {
    const html = markup({ label: 'Vastaa', placeholder: 'Kirjoita viesti' });
    expect(html).toContain('placeholder="Kirjoita viesti"');
  });

  test('the initial value renders as the textarea content', () => {
    const html = markup({ label: 'Vastaa', value: 'Ehdin torstaina' });
    expect(html).toMatch(/<textarea[^>]*>Ehdin torstaina<\/textarea>/);
  });
});

describe('the disabled state', () => {
  test('an enabled bar renders no disabled or inert markers', () => {
    const html = markup({
      label: 'Vastaa',
      leading: '<button type="button">Liitä</button>',
      trailing: '<button type="button">Lähetä</button>',
    });
    expect(html).not.toContain('disabled');
    expect(html).not.toContain('inert');
  });

  test('disabled reaches the textarea', () => {
    const html = markup({ label: 'Vastaa', disabled: true });
    expect(html).toMatch(/<textarea[^>]*disabled/);
  });

  test('disabled reaches the leading and trailing action regions', () => {
    const html = markup({
      label: 'Vastaa',
      disabled: true,
      leading: '<button type="button">Liitä</button>',
      trailing: '<button type="button">Lähetä</button>',
    });
    const actionDivs = [
      ...html.matchAll(/<div class="[^"]*actions[^"]*"[^>]*>/g),
    ];
    expect(actionDivs).toHaveLength(2);
    for (const [tag] of actionDivs) {
      expect(tag).toContain('inert');
    }
  });

  test('a disabled bar leaves its supplied buttons native, without a role or handler of its own', () => {
    const html = markup({
      label: 'Vastaa',
      disabled: true,
      leading: '<button type="button">Liitä</button>',
    });
    expect(html).toContain('<button type="button">Liitä</button>');
  });
});

describe('the optional regions', () => {
  test('given none of supporting, leading or trailing, none renders', () => {
    const html = markup({ label: 'Vastaa' });
    expect(html).not.toContain('class="supporting');
    expect(html).not.toContain('class="actions');
  });

  test('supporting content renders in its own region', () => {
    const html = markup({
      label: 'Vastaa',
      supporting: '<p>Liite: kartta.png</p>',
    });
    expect(html).toMatch(
      /<div class="[^"]*supporting[^"]*">\s*<p>Liite: kartta\.png<\/p>/,
    );
  });

  test('leading content renders before the textarea', () => {
    const html = markup({
      label: 'Vastaa',
      leading: '<button type="button">Liitä</button>',
    });
    expect(html.indexOf('Liitä')).toBeLessThan(html.indexOf('<textarea'));
  });

  test('trailing content renders after the textarea', () => {
    const html = markup({
      label: 'Vastaa',
      trailing: '<button type="button">Lähetä</button>',
    });
    expect(html.indexOf('</textarea>')).toBeLessThan(html.indexOf('Lähetä'));
  });
});

describe('the surface', () => {
  test('the visible box composes Surface at elevation 3', () => {
    const html = markup({ label: 'Vastaa' });
    expect(html).toMatch(
      /<div class="[^"]*cn-chat-bar[^"]*\bsurface\b[^"]*\belevation-3\b/,
    );
  });
});

/**
 * Cascade and container queries are not readable at this level, but the
 * declarations that erase the field's own box are literal source: they hold
 * or they do not, independent of the browser applying them.
 */
describe('the textarea rule, read as source', () => {
  const source = readFileSync(
    fileURLToPath(new URL('../components/CnChatBar.svelte', import.meta.url)),
    'utf8',
  );
  /* The field's own rule, not the wider band's nested growth-limit override. */
  const withoutContainerQueries = source.replace(
    /@container[^{]*\{[\s\S]*?\n {2}\}\n/g,
    '',
  );
  const rule =
    withoutContainerQueries.match(/\n\s*textarea\s*\{([\s\S]*?)\n\s*\}/)?.[1] ??
    '';

  test('draws no border', () => {
    expect(rule).toMatch(/border:\s*none/);
  });

  test('draws no background', () => {
    expect(rule).toMatch(/background:\s*none/);
  });

  test('draws no radius', () => {
    expect(rule).toMatch(/border-radius:\s*0/);
  });
});
