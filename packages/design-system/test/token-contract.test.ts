/**
 * Package unit tests for the token layers.
 *
 * The token system is a data contract: literal reference values followed by
 * semantic roles built from them. Every claim here is a property of the source
 * text, so none of it needs a browser. What genuinely needs a cascade — whether
 * a resolved token differs between light and dark — belongs in the design-site
 * browser checks.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const styles = new URL('../styles/', import.meta.url);

const read = (relativePath: string) =>
  stripComments(readFileSync(new URL(relativePath, styles), 'utf8'));

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every `--name: value` declaration, in source order. */
function declarations(css: string) {
  return [...css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+);/g)].map((match) => ({
    name: match[1],
    value: match[2].trim().replace(/\s+/g, ' '),
    index: match.index,
  }));
}

/**
 * The `@media` prelude enclosing an index, or '' outside any block. A property
 * declared twice under one prelude is drift; re-declared under another it is a
 * conditioned override, the shape poster.css uses to withdraw a cession.
 */
function mediaContext(css: string, at: number) {
  let context = '';
  for (const match of css.matchAll(/@media\s+([^{]+)\{/g)) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (index < css.length && depth > 0) {
      if (css[index] === '{') depth++;
      if (css[index] === '}') depth--;
      index++;
    }
    if (at > match.index && at < index) {
      context = match[1].replace(/\s+/g, ' ').trim();
    }
  }
  return context;
}

/** Split on commas that sit at depth zero, so nested calls stay intact. */
function topLevelParts(inner: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of inner) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

/**
 * Every `var()` reference with its balanced contents, so a reference that
 * supplies a fallback can be told apart from one that requires the property to
 * exist. `var(--x, currentColor)` is a deliberate optional dependency;
 * `var(--x)` is a hard one.
 */
function varReferences(css: string) {
  const references: { name: string; hasFallback: boolean }[] = [];
  for (const match of css.matchAll(/var\(/g)) {
    let depth = 1;
    let index = match.index + 4;
    let inner = '';
    while (index < css.length && depth > 0) {
      const char = css[index];
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth > 0) inner += char;
      index++;
    }
    const parts = topLevelParts(inner);
    references.push({ name: parts[0], hasFallback: parts.length > 1 });
  }
  return references;
}

const sheets = readdirSync(styles, { recursive: true, encoding: 'utf8' })
  .filter((name) => name.endsWith('.css'))
  .sort();

const chroma = read('chroma.css');
const semantic = read('semantic.css');
const elevation = read('elevation.css');

/** Everything the package itself defines, across all its stylesheets. */
const declaredInPackage = new Set(
  sheets.flatMap((sheet) => declarations(read(sheet)).map((d) => d.name)),
);

describe('layer composition', () => {
  test('color.css composes the layers bottom-up', () => {
    const imports = [...read('color.css').matchAll(/@import\s+"([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(imports.slice(0, 2)).toEqual(['./chroma.css', './semantic.css']);
  });

  test('tokens.css supplies units and colour before elevation', () => {
    const imports = [
      ...read('tokens.css').matchAll(/@import\s+"([^"]+)"/g),
    ].map((match) => match[1]);
    const at = (name: string) =>
      imports.findIndex((entry) => entry.endsWith(name));

    // elevation.css reads --cn-grid from units and paints with a semantic
    // colour, so both dependencies enter the cascade first.
    expect(at('elevation.css')).toBeGreaterThan(at('units.css'));
    expect(at('elevation.css')).toBeGreaterThan(at('color.css'));
  });

  test('chroma tokens are literal, so the stack has a bottom', () => {
    const referencing = declarations(chroma)
      .filter((declaration) => declaration.value.includes('var('))
      .map((declaration) => declaration.name);

    expect(referencing).toEqual([]);
  });

  test('no stylesheet reads the legacy Cyan colour vocabulary', () => {
    // The compat layer that declared these names left with Cyan's CSS. A read of
    // one now resolves to nothing, so the name may not reappear.
    const offenders = sheets.flatMap((sheet) =>
      varReferences(read(sheet))
        .filter((usage) => /^--(color|background)-/.test(usage.name))
        .map((usage) => `${sheet}: ${usage.name}`),
    );

    expect(offenders).toEqual([]);
  });

  test('semantic colours derive from the reference layer', () => {
    const literalColours = declarations(semantic)
      .filter((declaration) =>
        /#[0-9a-fA-F]{3,8}\b|\b(?:black|white)\b|\b(?:oklch|rgba?|hsla?)\(/.test(
          declaration.value,
        ),
      )
      .map((declaration) => `${declaration.name}: ${declaration.value}`);

    expect(literalColours).toEqual([]);
  });

  test('no stylesheet declares the same property twice in one media context', () => {
    const duplicates = sheets.flatMap((sheet) => {
      const css = read(sheet);
      const keys = declarations(css).map(
        (d) => `${d.name} @ "${mediaContext(css, d.index)}"`,
      );
      const seen = new Set<string>();
      return keys
        .filter((key) => seen.size === seen.add(key).size)
        .map((key) => `${sheet}: ${key}`);
    });

    expect(duplicates).toEqual([]);
  });
});

describe('resolvability', () => {
  test('every required property reference is defined by the package', () => {
    const dangling = new Set<string>();
    for (const sheet of sheets) {
      for (const usage of varReferences(read(sheet))) {
        if (usage.hasFallback) continue;
        if (declaredInPackage.has(usage.name)) continue;
        dangling.add(`${usage.name} (referenced in ${sheet})`);
      }
    }

    // A property referenced without a fallback must exist, or everything
    // computed from it is invalid at use time. Consumers that intend an
    // external or contextual value supply a fallback instead.
    expect([...dangling].sort()).toEqual([]);
  });

  test('every light-dark() token supplies both arms', () => {
    const incomplete = declarations(semantic + elevation)
      .filter((declaration) => declaration.value.includes('light-dark('))
      .filter((declaration) => {
        const inner = declaration.value.slice(
          declaration.value.indexOf('light-dark(') + 11,
          declaration.value.lastIndexOf(')'),
        );
        const arms = topLevelParts(inner);
        return arms.length !== 2 || arms.some((arm) => arm.length === 0);
      })
      .map((declaration) => declaration.name);

    expect(incomplete).toEqual([]);
  });
});

describe('generation', () => {
  test('every committed stylesheet matches its token source (--check passes)', () => {
    const script = fileURLToPath(
      new URL('../scripts/generate-tokens.mjs', import.meta.url),
    );
    // Throws (non-zero exit) if a committed stylesheet is stale against its
    // JSON source, per specs/design-system/design-tokens/spec.md.
    expect(() =>
      execFileSync('node', [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});

describe('the transparency ladder', () => {
  const transparency = read('transparency.css');
  const rungs = declarations(transparency);

  test('carries exactly the half step and steps 1 through 9', () => {
    expect(rungs.map((rung) => rung.name)).toEqual([
      '--cn-transparency-half',
      '--cn-transparency-1',
      '--cn-transparency-2',
      '--cn-transparency-3',
      '--cn-transparency-4',
      '--cn-transparency-5',
      '--cn-transparency-6',
      '--cn-transparency-7',
      '--cn-transparency-8',
      '--cn-transparency-9',
    ]);
  });

  test('every step is an eleven-percent multiple, and the half step is half of it', () => {
    for (const rung of rungs) {
      const step = rung.name.match(/^--cn-transparency-(\d+)$/)?.[1];
      if (!step) continue;
      expect(rung.value, rung.name).toBe(`${Number(step) * 11}%`);
    }

    const half = rungs.find((rung) => rung.name === '--cn-transparency-half');
    const one = rungs.find((rung) => rung.name === '--cn-transparency-1');
    expect(half?.value).toBe('5.5%');
    expect(one?.value).toBe('11%');
    expect(Number.parseFloat(half?.value ?? '')).toBe(
      Number.parseFloat(one?.value ?? '') / 2,
    );
  });

  test('a rung carries no colour and no scheme arm', () => {
    // A rung is a plain percentage the layer mixing it supplies colour for, so
    // it depends on nothing and never varies between Light and Dark.
    for (const rung of rungs) {
      expect(rung.value, rung.name).toMatch(/^[\d.]+%$/);
    }
  });
});
