/**
 * Contract tests for the typographic scale.
 *
 * Each check holds the stylesheet against another artefact — the typography
 * spec's table and prose, the unit tokens, the colour roles — rather than
 * reading the stylesheet and asserting its own contents. The values live in
 * the spec; a divergence between the two is the failure these exist to catch.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

/** Source with comments removed, so a commented-out example never counts. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

const spec = read('../../../specs/design-system/typography/spec.md');
const stylesheet = withoutComments(read('../styles/typography.css'));

/** Custom-property declarations of a stylesheet, as name -> value. */
function declarations(source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    found.set(name, value.replace(/\s+/g, ' ').trim());
  }
  return found;
}

/**
 * Resolve a var()/calc() chain to a rem number, so a derived line and the
 * spec's pixel value can be compared. Failures here are malformed input rather
 * than failed expectations, so they throw.
 */
function toRem(name: string, tokens: Map<string, string>): number {
  const seen = new Set<string>();
  const evaluate = (expression: string): number => {
    const trimmed = expression.trim();

    const variable = trimmed.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/);
    if (variable) {
      const target = variable[1];
      if (seen.has(target)) throw new Error(`cycle resolving ${target}`);
      seen.add(target);
      const next = tokens.get(target);
      if (next === undefined) throw new Error(`${target} is not defined`);
      return evaluate(next);
    }

    const calc = trimmed.match(/^calc\((.+)\)$/);
    if (calc) {
      const [left, operator, right] = calc[1]
        .split(/\s*([*/])\s*/)
        .map((part) => part.trim());
      const a = evaluate(left);
      const b = Number(right);
      if (Number.isNaN(b)) {
        throw new Error(`unsupported operand in ${trimmed}`);
      }
      return operator === '/' ? a / b : a * b;
    }

    const rem = trimmed.match(/^(-?[\d.]+)rem$/);
    if (!rem) throw new Error(`unsupported value: ${trimmed}`);
    return Number(rem[1]);
  };

  const declaration = tokens.get(name);
  if (declaration === undefined) throw new Error(`${name} is not defined`);
  return evaluate(declaration);
}

/** The scale's tokens, resolvable through the line unit they derive from. */
const tokens = new Map([
  ...declarations(read('../styles/units.css')),
  ...declarations(stylesheet),
]);

type Step = {
  name: string;
  size: number;
  line: number;
  weight: number;
  tracking: string;
};

/** The spec table: step, size and line in px against a 16px default, weight, tracking. */
function scaleFromSpec(): Step[] {
  const rows = [
    ...spec.matchAll(
      /^\|\s*(\w+)\s*\|\s*(\d+)px\s*\|\s*(\d+)px\s*\|\s*(\d{3})\s*\|\s*(-?[\d.]+em|normal)\s*\|\s*$/gm,
    ),
  ].map(([, name, size, line, weight, tracking]) => ({
    name,
    size: Number(size),
    line: Number(line),
    weight: Number(weight),
    tracking,
  }));
  expect(rows.length, 'the spec table went unparsed').toBeGreaterThan(0);
  return rows;
}

/**
 * The rules of a stylesheet fragment, one entry per selector: a grouped rule
 * (`h1, .text-h1 { … }`) registers its body under each of its selectors.
 */
function rules(source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, selectors, body] of source.matchAll(
    /([^{}@;]+)\{([^{}]*)\}/g,
  )) {
    for (const selector of selectors.split(',')) {
      found.set(selector.trim(), body.trim());
    }
  }
  return found;
}

const container = stylesheet.match(
  /@container \(max-width:\s*([\d.]+)rem\)\s*\{([\s\S]+)\}/,
);
const document = rules(stylesheet.replace(/@container[\s\S]+/, ''));
const narrow = container ? rules(container[2]) : new Map<string, string>();

describe('the scale', () => {
  test('every step is declared at the size, line and weight the table states', () => {
    for (const step of scaleFromSpec()) {
      expect(
        toRem(`--cn-font-size-${step.name}`, tokens) * 16,
        `${step.name} size`,
      ).toBe(step.size);
      expect(
        toRem(`--cn-line-height-${step.name}`, tokens) * 16,
        `${step.name} line`,
      ).toBe(step.line);
      expect(
        tokens.get(`--cn-font-weight-${step.name}`),
        `${step.name} weight`,
      ).toBe(String(step.weight));
      expect(
        tokens.get(`--cn-letter-spacing-${step.name}`),
        `${step.name} tracking`,
      ).toBe(step.tracking);
    }
  });

  test('the step set is closed: no size beyond the table is declared', () => {
    const published = [...tokens.keys()]
      .filter((name) => name.startsWith('--cn-font-size-'))
      .map((name) => name.replace('--cn-font-size-', ''))
      .sort();
    const specified = scaleFromSpec()
      .map((step) => step.name)
      .sort();
    expect(published).toEqual(specified);
  });

  test('every line derives from the line unit in the declaration', () => {
    for (const step of scaleFromSpec()) {
      expect(
        tokens.get(`--cn-line-height-${step.name}`),
        `${step.name} does not derive from --cn-line`,
      ).toContain('var(--cn-line)');
    }
  });

  test('the emphasis weight the prose states is published', () => {
    const prose = spec.match(/plus (\d{3}) for emphasis/);
    expect(prose, 'the spec no longer states the emphasis weight').toBeTruthy();
    const [, emphasis] = prose as RegExpMatchArray;
    expect(tokens.get('--cn-font-weight-emphasis')).toBe(emphasis);
  });
});

describe('the rules that read it', () => {
  test('the document reads at the text step, and .text-body mirrors it', () => {
    const body = document.get('body');
    expect(body).toContain('font-size: var(--cn-font-size-text)');
    expect(body).toContain('line-height: var(--cn-line-height-text)');
    // One rule, two selectors: the mirror cannot drift from the document.
    expect(document.get('.text-body')).toBe(body);
  });

  test('each heading element and its mirror class render the same step', () => {
    for (const name of ['h1', 'h2', 'h3', 'h4']) {
      for (const selector of [name, `.text-${name}`]) {
        const rule = document.get(selector);
        expect(rule, `${selector} has no rule`).toBeTruthy();
        expect(rule).toContain(`font-size: var(--cn-font-size-${name})`);
        expect(rule).toContain(`font-weight: var(--cn-font-weight-${name})`);
        expect(rule).toContain(`line-height: var(--cn-line-height-${name})`);
      }
      // One rule, two selectors: a mirror that drifts from its element fails here.
      expect(document.get(name)).toBe(document.get(`.text-${name}`));
    }
  });

  test('headings take the colour roles the theme declares', () => {
    const theme = declarations(read('../styles/semantic.css'));
    for (const [selector, role] of [
      ['h1', '--cn-color-text-heading'],
      ['h2', '--cn-color-text-heading'],
      ['h3', '--cn-color-text-subheading'],
      ['h4', '--cn-color-text-subheading'],
      ['.text-title', '--cn-color-text-heading'],
    ] as const) {
      expect(theme.has(role), `${role} is not a theme role`).toBe(true);
      expect(document.get(selector), selector).toContain(`color: var(${role})`);
    }
  });

  test('caption and label share the caption size and line, and only the caption is uppercased', () => {
    for (const selector of ['.text-caption', '.text-label']) {
      const rule = document.get(selector);
      expect(rule, selector).toContain(
        'font-size: var(--cn-font-size-caption)',
      );
      expect(rule, selector).toContain(
        'line-height: var(--cn-line-height-caption)',
      );
    }
    expect(document.get('.text-caption')).toContain(
      'text-transform: uppercase',
    );
    expect(document.get('.text-caption')).toContain(
      'font-weight: var(--cn-font-weight-caption)',
    );
    // The approved exception to v20: a label keeps the casing it is given.
    expect(document.get('.text-label')).not.toContain('text-transform');
    expect(document.get('.text-label')).toContain(
      'font-weight: var(--cn-font-weight-text)',
    );
  });
});

describe('the downshift', () => {
  test('its threshold is the published small-screen breakpoint, against the container', () => {
    // A container query cannot read a custom property, so the spec allows this
    // one literal. It must not drift from the breakpoint units.css publishes,
    // nor from the value the spec states in prose.
    const pinned = spec.match(/— ([\d.]+)rem,\s+(\d+)px at a 16px root/);
    expect(pinned, 'the spec no longer states the threshold').toBeTruthy();
    const [, rem, px] = pinned as RegExpMatchArray;
    expect(container, 'no container query found').toBeTruthy();
    expect((container as RegExpMatchArray)[1]).toBe(rem);
    expect(Number(rem) * 16).toBe(Number(px));
    expect(
      toRem('--cn-breakpoint-small', tokens),
      'the literal drifted from the published breakpoint',
    ).toBe(Number(rem));
  });

  test('h1 to h3 render one step down, h4 renders reading size at emphasis', () => {
    const steps = scaleFromSpec().map((step) => step.name);
    for (const name of ['h1', 'h2', 'h3', 'h4']) {
      const below = steps[steps.indexOf(name) + 1];
      const rule = narrow.get(name);
      expect(rule, `${name} does not downshift`).toBeTruthy();
      expect(rule).toContain(`font-size: var(--cn-font-size-${below})`);
      expect(rule).toContain(`line-height: var(--cn-line-height-${below})`);
      expect(rule).toContain(
        `letter-spacing: var(--cn-letter-spacing-${below})`,
      );
      // The mirror class downshifts with its element.
      expect(narrow.get(`.text-${name}`)).toBe(rule);
    }
    expect(narrow.get('h4')).toContain(
      'font-weight: var(--cn-font-weight-emphasis)',
    );
  });

  test('the title step does not downshift', () => {
    expect([...narrow.keys()].join()).not.toContain('title');
  });
});

describe('the reader-preference guarantee', () => {
  // Pixel lengths are swept across every stylesheet by lengths.test.ts.
  test('no rule touches the document root', () => {
    expect(stylesheet).not.toMatch(/(^|[^\w-])html\s*[,{]/);
    expect(stylesheet).not.toMatch(/:root\s*\{[^}]*[^-]font-size/);
  });
});
