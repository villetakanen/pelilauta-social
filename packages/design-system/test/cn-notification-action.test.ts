import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnNotificationAction from '../components/CnNotificationAction.svelte';

/**
 * The count a consumer states is normalised before it reaches the badge, and
 * the accessible name is composed from the label and that result. Neither
 * depends on the cascade, so both are read from the rendered markup rather
 * than from a browser.
 */
const markup = (count?: number | string) =>
  render(CnNotificationAction, {
    props: { href: '/inbox', noun: 'send', label: 'Ilmoitukset', count },
  }).body;

const badge = (html: string) =>
  html.match(/<span class="cn-notification-badge"[^>]*>([^<]*)<\/span>/)?.[1];

const name = (html: string) => html.match(/aria-label="([^"]*)"/)?.[1];

describe('the badge a count renders', () => {
  test('a whole number of one or more reaches the badge and the name', () => {
    expect(badge(markup(3))).toBe('3');
    expect(name(markup(3))).toBe('Ilmoitukset 3');
  });

  test('above nine, both read the ceiling', () => {
    expect(badge(markup(10))).toBe('9+');
    expect(name(markup(10))).toBe('Ilmoitukset 9+');
  });

  test.each([
    ['absent', undefined],
    ['empty', ''],
    ['zero', 0],
    ['negative', -3],
    ['fractional', 2.5],
  ])('%s renders no badge, and leaves the label alone', (_case, count) => {
    const html = markup(count);
    expect(badge(html)).toBeUndefined();
    expect(name(html)).toBe('Ilmoitukset');
  });

  test('a numeric string counts as its number', () => {
    expect(badge(markup('3'))).toBe('3');
  });
});
