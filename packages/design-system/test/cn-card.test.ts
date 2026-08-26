import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnCard from '../components/CnCard.svelte';

const markup = (props: Parameters<typeof render>[1]['props']) =>
  render(CnCard, { props }).body;

const snippet = (html: string) =>
  createRawSnippet(() => ({ render: () => html }));

describe('CnCard server rendering', () => {
  test('renders the required title in a passive article at elevation 1', () => {
    const html = markup({ title: 'The Iron Tower' });
    expect(html).toMatch(/<article class="cn-card elevation-1/);
    expect(html).toMatch(/<h4 class="title [^"]+">/);
    expect(html).toContain('The Iron Tower');
    expect(html).not.toMatch(/<a class="cn-card/);
  });

  test('renders supplied regions in contract order', () => {
    const html = markup({
      title: 'Subject',
      description: 'Summary',
      eyebrow: snippet('<a href="/channel">Channel</a>'),
      children: snippet('<p>Body</p>'),
      actions: snippet('<button type="button">Act</button>'),
    });
    const positions = [
      html.indexOf('class="eyebrow'),
      html.indexOf('<h4 class="title '),
      html.indexOf('class="description'),
      html.indexOf('<p>Body</p>'),
      html.indexOf('class="actions '),
    ];
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).not.toContain('<nav');
  });

  test('links the title and makes the decorative cover link unfocusable', () => {
    const html = markup({
      title: 'Linked',
      href: '/subjects/linked',
      cover: '/cover.svg',
      srcset: '/cover-small.svg 320w, /cover.svg 640w',
      sizes: '(max-width: 30rem) 100vw, 30rem',
    });
    expect(html.match(/href="\/subjects\/linked"/g)).toHaveLength(2);
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('alt=""');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('srcset="/cover-small.svg 320w, /cover.svg 640w"');
    expect(html).toContain('sizes="(max-width: 30rem) 100vw, 30rem"');
  });

  test('renders a decorative noun in the title or over the cover', () => {
    const inline = markup({ title: 'Fox', noun: 'fox' });
    const covered = markup({ title: 'Fox', noun: 'fox', cover: '/cover.svg' });
    const inlineTitle = inline.match(
      /<h4 class="title [^"]+">([\s\S]*?)<\/h4>/,
    )?.[1];
    const coveredTitle = covered.match(
      /<h4 class="title [^"]+">([\s\S]*?)<\/h4>/,
    )?.[1];
    expect(inlineTitle).toContain('<span aria-hidden="true">');
    expect(covered).toMatch(/class="cover-noun [^"]+" aria-hidden="true"/);
    expect(coveredTitle).not.toContain('<span aria-hidden="true">');
  });
});
