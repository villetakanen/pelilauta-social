/**
 * Contract tests for font delivery.
 *
 * What a browser reports about the loaded faces belongs to
 * `apps/design/e2e/fonts.spec.ts`. What is left here holds two artefacts
 * against each other: the stylesheet against the typography spec, and the
 * licence notice against the copies the applications serve.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const url = (relative: string) => new URL(relative, import.meta.url);
const read = (relative: string) =>
  readFileSync(fileURLToPath(url(relative)), 'utf8');

const fonts = read('../styles/fonts.css');

/** Source with comments removed, so a commented-out example never counts. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

type Declared = { family: string; weight: string; style: string };

/** Every @font-face rule in the stylesheet, as the properties a face declares. */
function declaredFaces(source: string): Declared[] {
  return [...source.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const value = (property: string) =>
      body.match(new RegExp(`${property}\\s*:\\s*([^;]+);`))?.[1].trim() ?? '';
    return {
      family: value('font-family').replace(/["']/g, ''),
      weight: value('font-weight'),
      style: value('font-style'),
    };
  });
}

const lato = declaredFaces(withoutComments(fonts)).filter(
  (face) => face.family === 'Lato',
);

/**
 * The weights the scale names, read from the typography spec's table rather than
 * restated: the two specs disagreeing is the failure this is here to catch. The
 * table's weight is its last column; the prose adds the two the table does not state.
 */
function weightsNamedByTypography(): number[] {
  const spec = read('../../../specs/design-system/typography/spec.md');
  const fromTable = [
    ...spec.matchAll(/^\|\s*(\w+)\s*\|.*\|\s*(\d{3})\s*\|\s*$/gm),
  ].map(([, , weight]) => Number(weight));
  const fromProse = [
    ...spec.matchAll(/plus (\d{3}) for [^.]*?and (\d{3}) for/g),
  ].flatMap(([, a, b]) => [Number(a), Number(b)]);
  return [...new Set([...fromTable, ...fromProse])].sort((a, b) => a - b);
}

describe('the face set', () => {
  test('every weight the typography spec names has an upright face', () => {
    const uprights = new Set(
      lato.filter((f) => f.style === 'normal').map((f) => Number(f.weight)),
    );
    for (const weight of weightsNamedByTypography()) {
      expect([...uprights], `weight ${weight} has no upright face`).toContain(
        weight,
      );
    }
  });
});

describe('the licence travels with the faces', () => {
  test('both applications serve the notice this package holds', () => {
    const notice = read('../fonts-license.txt');
    expect(notice).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(notice).toContain('Reserved Font Name "Lato"');
    expect(notice).toContain('The Roboto Mono Project Authors');
    for (const served of [
      '../../../apps/pelilauta/public/fonts-license.txt',
      '../../../apps/design/public/fonts-license.txt',
    ]) {
      expect(read(served), served).toBe(notice);
    }
  });

  test('the repository licence names the fonts as the exception', () => {
    // Collapsed, because the notice is prose and wraps wherever it wraps.
    const license = read('../../../LICENSE').replace(/\s+/g, ' ');
    expect(license).toContain('SIL Open Font License');
    expect(license).toContain('fonts-license.txt');
  });
});
