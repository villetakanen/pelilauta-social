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

/** Everything the package itself defines, across all its stylesheets. */
const declaredInPackage = new Set(
  sheets.flatMap((sheet) => declarations(read(sheet)).map((d) => d.name)),
);

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
