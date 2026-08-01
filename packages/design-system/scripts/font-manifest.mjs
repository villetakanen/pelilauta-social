/**
 * The face set the design system ships, and the source each face is cut from.
 *
 * This is the machine-readable half of `specs/design-system/fonts/spec.md`. The
 * stylesheet is hand-written because it states design decisions; this states which
 * files exist and where they came from, so `scripts/cut-fonts.mjs` can reproduce
 * them and `test/fonts.test.ts` can hold the stylesheet to them.
 *
 * A face is added or dropped by changing the spec, then this, then the stylesheet.
 *
 * Sources are npm packages held as devDependencies of this package. They are
 * build-time inputs only: what a reader downloads is the cut file in `fonts/`,
 * committed here, not whatever a dependency resolved to on the day of the build.
 */

/**
 * The two coverage ranges, as the spec states them. Nothing else is shipped:
 * Finnish, Swedish and English need ä ö å é (latin) and š ž (latin-ext).
 *
 * These are Google Fonts' canonical range definitions, kept verbatim so a face cut
 * here covers exactly what a face fetched from there would.
 */
export const RANGES = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

/**
 * The human register. Lato's published family is one file per weight covering every
 * alphabet it supports, so every face here is a cut.
 *
 * Weights 200-700 are the ones `specs/design-system/typography/spec.md` names, each
 * with its italic. 100 and 900 are the two the scale does not name, kept from the set
 * `apps/pelilauta` shipped.
 */
const LATO = [
  [100, 'hairline'],
  [200, 'thin'],
  [300, 'light'],
  [400, 'normal'],
  [500, 'medium'],
  [700, 'bold'],
  [900, 'black'],
];

/**
 * The technical register loads the weights its roles use and no others. No technical
 * role sets a heading or takes inline emphasis, so there is one weight and no italic.
 *
 * Roboto Mono is published pre-split by alphabet, so each range has its own source
 * file rather than sharing one. The cut still runs: it is what enforces that a
 * shipped face carries nothing outside its declared range.
 */
const ROBOTO_MONO = [[400, 'normal']];

/** Every face, one entry per family × weight × style × range. */
export const FACES = [
  ...LATO.flatMap(([weight, slug]) =>
    ['normal', 'italic'].flatMap((style) =>
      Object.keys(RANGES).map((range) => ({
        family: 'Lato',
        register: 'human',
        weight,
        style,
        range,
        file: `lato-${weight}-${style}-${range}.woff2`,
        source: `lato-font/fonts/lato-${slug}${
          style === 'italic' ? '-italic' : ''
        }/lato-${slug}${style === 'italic' ? '-italic' : ''}.woff`,
      })),
    ),
  ),
  ...ROBOTO_MONO.flatMap(([weight, style]) =>
    Object.keys(RANGES).map((range) => ({
      family: 'Roboto Mono',
      register: 'technical',
      weight,
      style,
      range,
      file: `roboto-mono-${weight}-${style}-${range}.woff2`,
      source: `@fontsource/roboto-mono/files/roboto-mono-${range}-${weight}-${style}.woff`,
    })),
  ),
];
