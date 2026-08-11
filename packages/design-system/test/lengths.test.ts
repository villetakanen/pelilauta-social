/* Every stylesheet states its lengths in units that scale with the reader's text. */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const dir = fileURLToPath(new URL('../styles/', import.meta.url));

const stylesheets = readdirSync(dir, { recursive: true, encoding: 'utf8' })
  .filter((name) => name.endsWith('.css'))
  .map((name) => ({ name, source: readFileSync(dir + name, 'utf8') }));

/*
 * Device affordances, which hold their weight at any text size: a focus ring with its
 * offset, and a hairline border. `0px` is a length-typed zero for a `var()` fallback.
 */
const allowed =
  /(outline(-offset)?|border[\w-]*)\s*:[^;]*|[\w-]*\(\s*[^)]*?0px[^)]*?\)/g;

const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '');

describe('the reader-preference guarantee', () => {
  test('the sweep reaches the stylesheets', () => {
    expect(stylesheets.length).toBeGreaterThan(10);
  });

  test.each(stylesheets)('$name states no pixel length', ({ source }) => {
    const remaining = withoutComments(source).replace(allowed, '');
    const pixels = remaining.match(/[\d.]+px/g) ?? [];
    expect(
      pixels,
      `${pixels.join(', ')} will not scale with the reader`,
    ).toEqual([]);
  });
});
