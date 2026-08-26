/**
 * CnLightbox server rendering.
 *
 * The initial server response is what these assertions cover: the gallery
 * markup, its order, and the closed dialog's shape. What only a browser can
 * verify belongs to `apps/design/e2e/cn-lightbox.spec.ts` — a server render
 * never opens the dialog and jsdom does not implement it.
 */

import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnLightbox from '../components/CnLightbox.svelte';

const markup = (props: Parameters<typeof render>[1]['props']) =>
  render(CnLightbox, { props }).body;

const image = (caption: string, src = '/cover.svg') => ({ src, caption });

/** The root gallery `<div>`'s class list, order-independent. */
const rootClasses = (html: string) =>
  html.match(/<div class="([^"]*)"/)?.[1].split(/\s+/) ?? [];

describe('CnLightbox server rendering', () => {
  test('an empty gallery renders nothing', () => {
    const html = markup({ images: [], openLabel: 'Open', closeLabel: 'Close' });
    expect(html).not.toContain('<div');
    expect(html).not.toContain('<dialog');
  });

  test('one image renders one figure, unstripped, with the caption after the image', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    const classes = rootClasses(html);
    expect(classes).toEqual(
      expect.arrayContaining(['cn-lightbox', 'elevation-2']),
    );
    expect(classes).not.toContain('strip');
    expect(html.match(/<figure class="item/g)).toHaveLength(1);
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('figcaption'));
  });

  test('three images render a strip with three figures in supplied order', () => {
    const html = markup({
      images: [image('First'), image('Second'), image('Third')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    const classes = rootClasses(html);
    expect(classes).toEqual(
      expect.arrayContaining(['cn-lightbox', 'elevation-2', 'strip']),
    );
    expect(html.match(/<figure class="item/g)).toHaveLength(3);
    const positions = ['First', 'Second', 'Third'].map((caption) =>
      html.indexOf(caption),
    );
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('every gallery image loads lazily', () => {
    const html = markup({
      images: [image('First'), image('Second')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    expect(html.match(/<img[^>]*loading="lazy"/g)).toHaveLength(2);
  });

  test('an image alt text is its caption', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    expect(html).toContain('alt="A tower"');
  });

  test('a non-empty caption leaves aria-label off the frame entirely', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    const frame = html.match(/<button[^>]*class="frame[^"]*"[^>]*>/)?.[0];
    expect(frame).toBeDefined();
    expect(frame).not.toContain('aria-label');
  });

  test('the gallery root precedes the dialog', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    expect(html.indexOf('cn-lightbox elevation-2')).toBeLessThan(
      html.indexOf('<dialog'),
    );
  });

  test('the dialog is a native dialog element carrying no role', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    const dialog = html.match(/<dialog[^>]*>/)?.[0];
    expect(dialog).toBeDefined();
    expect(dialog).not.toContain('role=');
  });

  test('the dialog renders the back action named by closeLabel, with no close noun anywhere', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Go back',
    });
    expect(html).toMatch(
      /<button[^>]*class="chrome-action cn-back-action"[^>]*>/,
    );
    expect(html).toContain('>Go back</span>');
    expect(html.toLowerCase()).not.toContain('close');
  });

  test('no whole image is present when no image is active', () => {
    const html = markup({
      images: [image('A tower')],
      openLabel: 'Open',
      closeLabel: 'Close',
    });
    expect(html).not.toContain('class="whole"');
  });
});
