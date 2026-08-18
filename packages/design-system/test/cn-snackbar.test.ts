import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import CnSnackbar, {
  EXIT_MS,
  type Snack,
} from '../components/CnSnackbar.svelte';

/**
 * What the markup carries: whether a snack renders at all, what announces it,
 * and whether an action arrives as a button. None of it depends on the cascade
 * or on a timer, so it is read from the rendered markup. The display period,
 * the exit and the dismissal request are behaviour over time, and
 * apps/design/e2e/cn-snackbar.spec.ts drives them in a browser.
 */
const markup = (snack?: Snack) => render(CnSnackbar, { props: { snack } }).body;

describe('what a snack renders', () => {
  /* Svelte's hydration markers are comments, and a comment is not an element. */
  test('no snack renders nothing', () => {
    expect(
      markup()
        .replace(/<!--.*?-->/g, '')
        .trim(),
    ).toBe('');
  });

  test('the message announces as a status', () => {
    const html = markup({ message: 'Sivu tallennettu' });
    expect(html).toContain('role="status"');
    expect(html).toContain('Sivu tallennettu');
  });

  test('a snack without an action renders no button', () => {
    expect(markup({ message: 'Sivu tallennettu' })).not.toContain('<button');
  });

  test('an action renders a native button bearing its label', () => {
    const html = markup({
      message: 'Sivu poistettu',
      action: { label: 'Kumoa', callback: () => {} },
    });
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('Kumoa');
  });
});

/**
 * The dismissal request waits out the exit transition, and script cannot read
 * the custom property that transition runs at. The literal in the component is
 * pinned to the token here, so the two cannot drift apart silently.
 */
test('the exit delay matches the shared UI duration', () => {
  const units = readFileSync(
    fileURLToPath(new URL('../styles/units.css', import.meta.url)),
    'utf8',
  );
  const duration = units.match(/--cn-duration-ui:\s*([\d.]+)s/)?.[1];

  expect(duration).toBeDefined();
  expect(Number(duration) * 1000).toBe(EXIT_MS);
});
