/**
 * Contract tests for font delivery.
 *
 * Every failure mode here is silent. A weight with no face renders synthesised and
 * is approximately right at every size. A family named in a stack and never loaded
 * renders correctly for anyone who has it installed, which includes whoever is
 * looking at the screen. A renamed face file breaks a `url()` that some bundlers
 * tolerate. So the checks compare the stylesheet against the spec that names the
 * weights and against the files on disk, rather than against a screenshot.
 *
 * Spec: specs/design-system/fonts/spec.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
// @ts-expect-error - plain ESM manifest shared with scripts/cut-fonts.mjs
import { FACES, RANGES } from '../scripts/font-manifest.mjs';

const url = (relative: string) => new URL(relative, import.meta.url);
const read = (relative: string) =>
  readFileSync(fileURLToPath(url(relative)), 'utf8');

const fonts = read('../styles/fonts.css');

/** Source with comments removed, so a commented-out example never counts. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

type Face = {
  family: string;
  weight: number;
  style: string;
  range: string;
  file: string;
  source: string;
};

type Declared = {
  family: string;
  weight: string;
  style: string;
  display: string;
  src: string;
  range: string;
};

/** Every @font-face rule in the stylesheet, as the properties this spec constrains. */
function declaredFaces(source: string): Declared[] {
  const blocks = [...source.matchAll(/@font-face\s*\{([^}]*)\}/g)];
  return blocks.map(([, body]) => {
    const value = (property: string) =>
      body.match(new RegExp(`${property}\\s*:\\s*([^;]+);`))?.[1].trim() ?? '';
    return {
      family: value('font-family').replace(/["']/g, ''),
      weight: value('font-weight'),
      style: value('font-style'),
      display: value('font-display'),
      src: value('src'),
      range: value('unicode-range').replace(/\s+/g, ''),
    };
  });
}

const declared = declaredFaces(withoutComments(fonts));

/**
 * The weights the scale names, read from the typography spec's table rather than
 * restated: the two specs disagreeing is the failure this is here to catch. The
 * table's weight is its last column; the prose adds the two the table does not state.
 */
function weightsNamedByTypography(): number[] {
  const spec = read('../../../specs/design-system/typography/spec.md');
  const rows = [...spec.matchAll(/^\|\s*(\w+)\s*\|.*\|\s*(\d{3})\s*\|\s*$/gm)];
  const fromTable = rows.map(([, , weight]) => Number(weight));
  const fromProse = [
    ...spec.matchAll(/plus (\d{3}) for [^.]*?and (\d{3}) for/g),
  ].flatMap(([, a, b]) => [Number(a), Number(b)]);
  return [...new Set([...fromTable, ...fromProse])].sort((a, b) => a - b);
}

describe('the face set', () => {
  test('declares exactly the faces the manifest lists', () => {
    expect(
      declared.map(
        (face) => `${face.family} ${face.weight} ${face.style} ${face.range}`,
      ),
    ).toEqual(
      (FACES as Face[]).map(
        (face) =>
          `${face.family} ${face.weight} ${face.style} ${RANGES[face.range].replace(/\s+/g, '')}`,
      ),
    );
  });

  test('every weight the typography spec names has an upright face', () => {
    const uprights = new Set(
      declared
        .filter((face) => face.style === 'normal' && face.family === 'Lato')
        .map((face) => Number(face.weight)),
    );
    for (const weight of weightsNamedByTypography()) {
      expect([...uprights], `weight ${weight} has no upright face`).toContain(
        weight,
      );
    }
  });

  test('every weight the human register loads also loads its italic', () => {
    // A missing italic is synthesised by slanting the upright, which never fails.
    const key = (face: Declared) => `${face.weight} ${face.range}`;
    const uprights = declared
      .filter((face) => face.family === 'Lato' && face.style === 'normal')
      .map(key);
    const italics = new Set(
      declared
        .filter((face) => face.family === 'Lato' && face.style === 'italic')
        .map(key),
    );
    for (const face of uprights) {
      expect([...italics], `${face} has no italic`).toContain(face);
    }
  });

  test('every declared source resolves to a file this repository ships', () => {
    for (const face of declared) {
      const path = face.src.match(/url\(\s*["']?([^"')]+)["']?\s*\)/)?.[1];
      expect(
        path,
        `${face.family} ${face.weight} states no url()`,
      ).toBeTruthy();
      expect(
        existsSync(fileURLToPath(url(`../styles/${path}`))),
        `${path} does not exist`,
      ).toBe(true);
    }
  });

  test('every face swaps', () => {
    for (const face of declared) {
      expect(face.display, `${face.family} ${face.weight} ${face.style}`).toBe(
        'swap',
      );
    }
  });

  test('every face states a unicode-range, and only latin and latin-ext', () => {
    const allowed = Object.values(RANGES as Record<string, string>).map(
      (range) => range.replace(/\s+/g, ''),
    );
    for (const face of declared) {
      expect(
        allowed,
        `${face.file ?? face.src} is outside the two ranges`,
      ).toContain(face.range);
    }
  });

  test('every face is woff2 and states no other format', () => {
    for (const face of declared) {
      expect(face.src).toContain('format("woff2")');
      expect(face.src.match(/format\(/g)).toHaveLength(1);
    }
  });
});

describe('the two families', () => {
  test('are declared here, with a non-serif fallback for a failed load', () => {
    expect(fonts).toMatch(/--cn-font-family:\s*Lato/);
    expect(fonts).toMatch(/--cn-font-family-mono:\s*\n?\s*"Roboto Mono"/);
    // With every face blocked, neither register may fall to the browser's serif.
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
      '../styles/icon.css',
      '../styles/color.css',
      '../styles/color-theme.css',
      '../styles/color-reference.css',
      '../styles/content-containers.css',
      '../styles/docs.css',
      '../styles/compat/cyan-4.css',
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

  test('are applied to the document and to the technical roles', () => {
    const rules = withoutComments(fonts).replace(/@font-face\s*\{[^}]*\}/g, '');
    expect(rules).toMatch(
      /body\s*\{[^}]*font-family:\s*var\(--cn-font-family\)/,
    );
    for (const selector of [
      'code',
      'kbd',
      'samp',
      'pre',
      'select',
      'textarea',
    ]) {
      expect(rules, `${selector} is not in the technical register`).toMatch(
        new RegExp(`(^|,)\\s*${selector}\\s*(,|\\{)`, 'm'),
      );
    }
    expect(rules).toMatch(/input:not\(/);
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
