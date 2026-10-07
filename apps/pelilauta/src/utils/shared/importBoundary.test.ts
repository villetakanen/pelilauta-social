import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const srcRoot = fileURLToPath(new URL('../../', import.meta.url));

/** Runtime `marked` imports belong to the shared renderer and its private extensions. */
const PERMITTED = [
  'utils/shared/getMarked.ts',
  'utils/server/renderChangelog.ts',
  /^utils\/shared\/marked\//,
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|mjs|astro|svelte)$/.test(entry.name) ? [path] : [];
  });
}

// Matches `import x from 'marked'`, `import 'marked-footnote'`,
// `await import('marked')` and `export ... from 'marked'`; type-only
// imports and exports are allowed.
const RUNTIME_IMPORT =
  /(?:^|[\s;])(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s+)?['"](marked(?:-[\w-]+)?)['"]|\bimport\(\s*['"](marked(?:-[\w-]+)?)['"]\s*\)/gm;

function runtimeImports(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(RUNTIME_IMPORT)) {
    const statement = match[0];
    // `import { type A, type B } from` is not type-only in general, but
    // inline `type` specifiers alone import nothing at runtime.
    const specifiers = /\{([^}]*)\}/.exec(statement)?.[1];
    if (
      specifiers
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .every((s) => s.startsWith('type '))
    ) {
      continue;
    }
    found.push(match[1] ?? match[2]);
  }
  return found;
}

test('runtime marked imports stay inside the shared renderer', () => {
  const offenders = sourceFiles(srcRoot)
    .filter((file) => !/\.test\.ts$/.test(file))
    .map((file) => relative(srcRoot, file).split(sep).join('/'))
    .filter(
      (file) =>
        !PERMITTED.some((p) =>
          typeof p === 'string' ? p === file : p.test(file),
        ),
    )
    .filter(
      (file) =>
        runtimeImports(readFileSync(join(srcRoot, file), 'utf8')).length > 0,
    );
  expect(offenders).toEqual([]);
});
