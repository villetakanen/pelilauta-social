/**
 * Package unit tests for the token layers.
 *
 * The token system is a data contract: three stylesheets that must compose in
 * one direction — literal reference values, semantic v20 roles built from them,
 * and a Cyan 4 compatibility layer that renames those roles for unmigrated v18
 * consumers. Every claim here is a property of the source text, so none of it
 * needs a browser. What genuinely needs a cascade — whether a resolved token
 * differs between light and dark — belongs in the design-site browser checks.
 *
 * Spec: specs/design-system/design-tokens/spec.md
 */
import { readdirSync, readFileSync } from 'node:fs';
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

const reference = read('color-reference.css');
const theme = read('color-theme.css');
const compat = read('compat/cyan-4.css');

/** Everything the package itself defines, across all its stylesheets. */
const declaredInPackage = new Set(
  sheets.flatMap((sheet) => declarations(read(sheet)).map((d) => d.name)),
);

describe('layer composition', () => {
  test('color.css composes the layers bottom-up', () => {
    const imports = [...read('color.css').matchAll(/@import\s+"([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(imports).toEqual([
      './color-reference.css',
      './color-theme.css',
      './compat/cyan-4.css',
    ]);
  });

  test('reference tokens are literal, so the stack has a bottom', () => {
    const referencing = declarations(reference)
      .filter((declaration) => declaration.value.includes('var('))
      .map((declaration) => declaration.name);

    expect(referencing).toEqual([]);
  });

  test('no stylesheet declares the same property twice', () => {
    const duplicates = sheets.flatMap((sheet) => {
      const names = declarations(read(sheet)).map((d) => d.name);
      const seen = new Set<string>();
      return names
        .filter((name) => seen.size === seen.add(name).size)
        .map((name) => `${sheet}: ${name}`);
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
    // external or contextual value supply a fallback instead — which is why
    // var(--color-on, currentColor) in compat/cyan-4.css is not counted here.
    expect([...dangling].sort()).toEqual([]);
  });

  test('every light-dark() token supplies both arms', () => {
    const incomplete = declarations(theme)
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

describe('cyan 4 compatibility layer', () => {
  const compatDeclarations = declarations(compat);
  const ownedByV20 = new Set(
    [...declarations(reference), ...declarations(theme)].map((d) => d.name),
  );

  test('the compat layer is a mapping, never a second source of values', () => {
    const literal = compatDeclarations
      .filter((declaration) => !declaration.value.includes('var(--cn-'))
      .map((declaration) => `${declaration.name}: ${declaration.value}`);

    // A raw value here would let a legacy name drift away from the v20 role it
    // is supposed to alias.
    expect(literal).toEqual([]);
  });

  test('the compat layer declares no colour of its own', () => {
    const hardcoded = compatDeclarations
      .filter((declaration) =>
        /#[0-9a-fA-F]{3,8}\b|\boklch\(|\brgba?\(|\bhsla?\(/.test(
          declaration.value,
        ),
      )
      .map((declaration) => declaration.name);

    expect(hardcoded).toEqual([]);
  });

  test('every legacy alias resolves into a token the v20 layer owns', () => {
    const unresolved = compatDeclarations.flatMap((declaration) =>
      varReferences(declaration.value)
        .filter((usage) => !usage.hasFallback)
        .filter((usage) => !ownedByV20.has(usage.name))
        .map((usage) => `${declaration.name} -> ${usage.name}`),
    );

    // The compat layer must terminate in the owned reference/theme layers, not
    // in itself: an alias chain that stays inside compat has no v20 authority
    // behind it.
    expect(unresolved).toEqual([]);
  });
});
