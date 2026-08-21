import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnLoader from '../components/CnLoader.svelte';

const markup = (props: Parameters<typeof render>[1]['props']) =>
  render(CnLoader, { props }).body;

describe('CnLoader server rendering', () => {
  test('renders default standalone CnLoader with role="status" and default props', () => {
    const html = markup({});
    expect(html).toMatch(/class="cn-loader/);
    expect(html).not.toContain('cn-loader-inline');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading"');
    expect(html).toMatch(/class="lds-dual-ring/);
    expect(html).toContain('data-noun="fox"');
  });

  test('the icon is decorative, so the status region announces only its label', () => {
    const html = markup({});
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain('<title>');
  });

  test('renders inline variant with small icon', () => {
    const html = markup({ inline: true });
    expect(html).toContain('cn-loader-inline');
    expect(html).toContain('data-noun="fox"');
  });

  test('forwards custom noun and custom aria-label', () => {
    const html = markup({ noun: 'cat', label: 'Processing data…' });
    expect(html).toContain('aria-label="Processing data…"');
    expect(html).toContain('data-noun="cat"');
  });
});
