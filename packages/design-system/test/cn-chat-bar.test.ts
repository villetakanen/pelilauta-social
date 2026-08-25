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
  menu?: string;
  menuLabel?: string;
  leading?: string;
  trailing?: string;
}) =>
  render(CnChatBar, {
    props: {
      ...props,
      supporting: props.supporting ? snippet(props.supporting) : undefined,
      menu: props.menu ? snippet(props.menu) : undefined,
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
});

describe("the bar's own add action", () => {
  test('given no menu, the bar renders no action of its own', () => {
    const html = markup({ label: 'Vastaa' });
    expect(html).not.toContain('cn-menu-trigger');
  });

  test('the action is a menu trigger, named by menuLabel', () => {
    const html = markup({
      label: 'Vastaa',
      menu: '<button type="button">Lisää kuva</button>',
      menuLabel: 'Lisää',
    });
    expect(html).toMatch(/class="[^"]*cn-menu-trigger[^"]*"/);
    expect(html).toContain('aria-label="Lisää"');
  });

  test('the trigger takes the chrome action presentation', () => {
    const html = markup({
      label: 'Vastaa',
      menu: '<button type="button">Lisää kuva</button>',
    });
    expect(html).toMatch(/class="chrome-action cn-menu-trigger"/);
  });

  test("the items are the consumer's, on the menu surface", () => {
    const html = markup({
      label: 'Vastaa',
      menu: '<button type="button">Lisää kuva</button>',
    });
    expect(html).toMatch(
      /class="cn-menu-container[^"]*"[^>]*><button type="button">Lisää kuva<\/button>/,
    );
  });

  test('the action stands before the textarea', () => {
    const html = markup({
      label: 'Vastaa',
      menu: '<button type="button">Lisää kuva</button>',
    });
    expect(html.indexOf('cn-menu-trigger')).toBeLessThan(
      html.indexOf('<textarea'),
    );
  });

  test('disabled reaches the action', () => {
    const html = markup({
      label: 'Vastaa',
      menu: '<button type="button">Lisää kuva</button>',
      disabled: true,
    });
    expect(html).toMatch(/<div class="actions[^"]*" inert/);
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
