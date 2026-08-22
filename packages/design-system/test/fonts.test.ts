/**
 * Contract tests for font delivery.
 *
 * Every failure mode here is silent. A weight with no face renders synthesised and is
 * approximately right at every size. A family named in a stack and never loaded
 * renders correctly for anyone who has it installed, which includes whoever is looking
 * at the screen. A bare specifier that no longer resolves breaks a `url()` that some
 * bundlers tolerate. And a licence notice that stops matching the one the applications
 * serve is a notice nobody is served.
 *
 * So each check holds two artefacts against each other — the stylesheet against the
 * typography spec, against the installed packages, against the served notices — rather
 * than reading the stylesheet and asserting its own contents.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const url = (relative: string) => new URL(relative, import.meta.url);
const read = (relative: string) =>
  readFileSync(fileURLToPath(url(relative)), 'utf8');

const fonts = read('../styles/fonts.css');

/** Source with comments removed, so a commented-out example never counts. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

type Declared = {
  family: string;
  weight: string;
  style: string;
  display: string;
  src: string;
  specifier: string;
  range: string;
};

/** Every @font-face rule in the stylesheet, as the properties a face declares. */
function declaredFaces(source: string): Declared[] {
  return [...source.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const value = (property: string) =>
      body.match(new RegExp(`${property}\\s*:\\s*([^;]+);`))?.[1].trim() ?? '';
    const src = value('src');
    return {
      family: value('font-family').replace(/["']/g, ''),
      weight: value('font-weight'),
      style: value('font-style'),
      display: value('font-display'),
      src,
      specifier: src.match(/url\(\s*["']?([^"')]+)["']?\s*\)/)?.[1] ?? '',
      range: value('unicode-range').replace(/\s+/g, ''),
    };
  });
}

const declared = declaredFaces(withoutComments(fonts));
const lato = declared.filter((face) => face.family === 'Lato');
const mono = declared.filter((face) => face.family === 'Roboto Mono');

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

  test('every weight Lato loads also loads its italic', () => {
    // A missing italic is synthesised by slanting the upright, which never fails.
    const italics = new Set(
      lato.filter((f) => f.style === 'italic').map((f) => f.weight),
    );
    for (const face of lato.filter((f) => f.style === 'normal')) {
      expect([...italics], `${face.weight} has no italic`).toContain(
        face.weight,
      );
    }
  });

  test('every declared source resolves to an installed file', () => {
    for (const face of declared) {
      expect(
        face.specifier,
        `${face.family} ${face.weight} ${face.style} states no url()`,
      ).toBeTruthy();
      expect(() => require.resolve(face.specifier)).not.toThrow();
    }
  });

  test('every face is a publisher file, not one this repository produced', () => {
    // The spec forbids a modified face. A path into this package would be one.
    for (const face of declared) {
      expect(face.specifier, face.specifier).not.toMatch(/^[./]/);
    }
  });

  test('every face swaps, and states woff2 as its only format', () => {
    for (const face of declared) {
      expect(face.display, `${face.family} ${face.weight}`).toBe('swap');
      expect(face.src).toContain('format("woff2")');
      expect(face.src.match(/format\(/g)).toHaveLength(1);
    }
  });
});

describe('coverage', () => {
  test('Lato declares no range, because its files are whole', () => {
    for (const face of lato) {
      expect(face.range, `${face.weight} ${face.style}`).toBe('');
    }
  });

  test('Roboto Mono splits latin and latin-ext, each with its range', () => {
    // Without ranges the later declaration wins and the earlier never loads.
    expect(mono).toHaveLength(2);
    expect(mono.map((f) => f.specifier).sort()).toEqual([
      '@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2',
      '@fontsource/roboto-mono/files/roboto-mono-latin-ext-400-normal.woff2',
    ]);
    for (const face of mono) {
      expect(face.range, face.specifier).not.toBe('');
    }
    expect(mono[0].range).not.toBe(mono[1].range);
  });
});

describe('the two families', () => {
  test('are declared here, with a non-serif fallback for a failed load', () => {
    const stacks = [...fonts.matchAll(/--cn-font-family(-mono)?:([^;]+);/g)];
    expect(stacks).toHaveLength(2);
    expect(stacks[0][2]).toMatch(/sans-serif\s*$/);
    expect(stacks[1][2]).toMatch(/monospace\s*$/);
  });

  test('are named nowhere else in the design system', () => {
    for (const path of [
      '../styles/preflight.css',
      '../styles/tokens.css',
      '../styles/units.css',
      '../styles/color.css',
      '../styles/chroma.css',
      '../styles/semantic.css',
      '../styles/elevation.css',
      '../styles/content-containers.css',
      '../styles/typography.css',
      '../styles/docs.css',
    ]) {
      // `font-family: inherit` names nothing — it is the reset handing a control
      // back to whatever the document decided, which is this stylesheet's decision.
      const values = [
        ...withoutComments(read(path)).matchAll(/font-family\s*:\s*([^;}]+)/g),
      ].map(([, value]) => value.trim());
      expect(
        values.filter((value) => value !== 'inherit'),
        path,
      ).toEqual([]);
    }
  });
});

describe('neither application declares a face', () => {
  test('apps/pelilauta names no family and declares no face', () => {
    const overrides = read('../../../apps/pelilauta/src/overrides.css');
    expect(withoutComments(overrides)).not.toMatch(
      /@font-face|font-family\s*:/,
    );
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
