import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnIdentityAction from '../components/CnIdentityAction.svelte';

/**
 * Neither the mode nor the disabled attributes depend on the cascade, so both
 * are read from the rendered markup rather than from a browser.
 */
const markup = (props: {
  href: string;
  label: string;
  signedIn?: boolean;
  nick?: string;
  disabled?: boolean;
}) => render(CnIdentityAction, { props }).body;

describe('the mode a consumer states', () => {
  test('signed out carries the login glyph', () => {
    const html = markup({ href: '/login', label: 'Kirjaudu sisään' });
    expect(html).toContain('data-noun="login"');
    expect(html).not.toContain('cn-avatar');
  });

  test('signed in carries the identity mark, nick or not', () => {
    const html = markup({
      href: '/profile',
      label: 'Oma sivu',
      signedIn: true,
    });
    expect(html).toContain('cn-avatar');
    expect(html).not.toContain('data-noun="login"');
  });

  test('signed in with an empty nick keeps the signed-in mode', () => {
    const html = markup({
      href: '/profile',
      label: 'Oma sivu',
      signedIn: true,
      nick: '',
    });
    expect(html).toContain('cn-avatar');
    expect(html).not.toContain('data-noun="login"');
  });
});

describe('the destination and label', () => {
  test('signed out renders an anchor with the stated href and label', () => {
    const html = markup({ href: '/login', label: 'Kirjaudu sisään' });
    expect(html).toContain('href="/login"');
    expect(html).toContain('<span>Kirjaudu sisään</span>');
  });

  test('signed in renders an anchor with the stated href and label', () => {
    const html = markup({
      href: '/profile',
      label: 'Oma sivu',
      signedIn: true,
    });
    expect(html).toContain('href="/profile"');
    expect(html).toContain('<span>Oma sivu</span>');
  });
});

describe('disabled', () => {
  test('renders aria-disabled and tabindex, and keeps the href', () => {
    const html = markup({
      href: '/profile',
      label: 'Oma sivu',
      signedIn: true,
      disabled: true,
    });
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('href="/profile"');
  });
});
