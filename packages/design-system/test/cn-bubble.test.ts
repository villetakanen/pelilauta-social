import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnBubble from '../components/CnBubble.svelte';

/**
 * What the markup carries: the element the message arrives as, where its content
 * sits, whether the mark is there and what the variant changes. The server
 * response is the subject — the spec has the complete article reaching the reader
 * without script — while the shape, the tail, the colour roles and the width the
 * mark answers are cascade, and apps/design/e2e/cn-bubble.spec.ts reads those off
 * the rendered book.
 */

const snippet = (html: string) =>
  createRawSnippet(() => ({ render: () => html }));

/** Svelte marks hydration boundaries with comments, which are not elements. */
const markup = (
  props: {
    reply?: boolean;
    nick?: string;
    avatar?: string;
    children?: string;
  } = {},
) =>
  render(CnBubble, {
    props: {
      ...props,
      children: props.children ? snippet(props.children) : undefined,
    },
  })
    .body.replace(/<!--.*?-->/g, '')
    .trim();

describe('the message element', () => {
  test('the root is the row, and carries no role of its own', () => {
    expect(markup()).toMatch(/^<div class="[^"]*cn-bubble-row/);
    expect(markup()).not.toContain('role=');
  });

  test('the message is an article inside the row', () => {
    expect(markup()).toMatch(/<article class="[^"]*cn-bubble/);
  });

  test('a bubble with no content still renders the article', () => {
    expect(markup()).toMatch(/<article[^>]*>\s*<\/article>\s*<\/div>$/);
  });

  test('the tail adds no element', () => {
    expect(markup({ children: '<p>Ehdin torstaina.</p>' })).not.toMatch(
      /<(?!\/?(div|article|p)\b)[a-z]/,
    );
  });
});

describe('the content', () => {
  test('a message renders inside the article, with nothing between', () => {
    expect(markup({ children: '<p>Ehdin torstaina.</p>' })).toMatch(
      /<article[^>]*>\s*<p>Ehdin torstaina\.<\/p>\s*<\/article>/,
    );
  });

  test('a band renders as a direct child of the article', () => {
    const html = markup({
      children: '<header><p>Rauta-Kalle</p></header><p>Ehdin.</p>',
    });
    expect(html).toMatch(/<article[^>]*>\s*<header>/);
    expect(html).toMatch(/<\/p>\s*<\/article>/);
  });
});

describe('the mark', () => {
  test('a bubble given neither nick nor avatar renders no mark', () => {
    expect(markup()).not.toContain('cn-bubble-mark');
    expect(markup()).not.toContain('cn-avatar');
  });

  test('a nick renders the mark', () => {
    expect(markup({ nick: 'Rauta-Kalle' })).toContain('cn-bubble-mark');
  });

  test('an avatar without a nick renders the mark', () => {
    expect(markup({ avatar: 'https://example.test/kalle.webp' })).toContain(
      'cn-bubble-mark',
    );
  });

  test('the mark stands before the message in the row', () => {
    const html = markup({ nick: 'Rauta-Kalle' });
    expect(html.indexOf('cn-bubble-mark')).toBeLessThan(
      html.indexOf('<article'),
    );
  });

  test('the mark announces nothing, and names no participant', () => {
    const html = markup({ nick: 'Rauta-Kalle' });
    expect(html).toMatch(/class="[^"]*cn-bubble-mark[^"]*"[^>]*aria-hidden/);
    expect(html).not.toContain('aria-label');
    expect(html).not.toContain('role="img"');
  });

  test('the mark presents no interactive affordance', () => {
    const html = markup({ nick: 'Rauta-Kalle' });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('tabindex');
  });

  test('a nick without an avatar reduces to initials', () => {
    const html = markup({ nick: 'Rauta-Kalle' });
    expect(html).toContain('cn-avatar__initials');
    expect(html).toMatch(/>\s*RA\s*</);
    expect(html).not.toContain('cn-avatar__image');
  });

  test('an avatar renders the picture over the initials', () => {
    const html = markup({
      nick: 'Rauta-Kalle',
      avatar: 'https://example.test/kalle.webp',
    });
    expect(html).toContain('cn-avatar__image');
    expect(html).toContain('https://example.test/kalle.webp');
  });
});

describe('the variant', () => {
  test('the default variant is unmarked', () => {
    expect(markup()).not.toContain('reply');
  });

  test('the reply variant marks the row and the article', () => {
    const html = markup({ reply: true });
    expect(html).toMatch(/^<div class="[^"]*\breply\b/);
    expect(html).toMatch(/<article class="[^"]*\breply\b/);
  });

  test('the variants differ in that mark and nothing else', () => {
    const children = '<p>Ehdin torstaina.</p>';
    expect(markup({ reply: true, children }).replaceAll(' reply', '')).toBe(
      markup({ children }),
    );
  });
});
