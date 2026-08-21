/**
 * The v18 editor wrapper read `document.body.classList` at module scope, so
 * importing it on the server threw. A jsdom test cannot prove this defect is
 * gone: jsdom hands every module `document`, `window` and `navigator` before
 * import, the same as a browser would, so a module-scope read succeeds
 * silently under this very suite. Only reading the source text — never
 * executing it — can show the read is not there at all. So this is a
 * source-text check, checking every .ts and .svelte source the package ships rather than
 * one entry point, because any of them could carry the read that breaks the
 * server import.
 *
 * "At the top level" is read here as: a statement starting at column zero,
 * once comments are stripped. Every read in this package's actual code sits
 * inside a function body and so is indented — `resolveDark`'s
 * `getComputedStyle(target)` and `window.matchMedia`, and `createEditor`'s
 * `typeof window === 'undefined'` guard. A column-zero statement is the
 * shape a module-scope read takes in this codebase's style, so it is what
 * the check flags.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test, vi } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'test', 'dist', '.svelte-kit']);

function findTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIP_DIRS.has(entry.name)
        ? []
        : findTsFiles(join(dir, entry.name));
    }
    return entry.name.endsWith('.ts') || entry.name.endsWith('.svelte')
      ? [join(dir, entry.name)]
      : [];
  });
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const GLOBALS = /^(document|window|navigator)\b/;

function topLevelGlobalReads(source: string): string[] {
  return stripComments(source)
    .split('\n')
    .filter((line) => GLOBALS.test(line));
}

const files = findTsFiles(packageRoot);

describe('no module reads document, window or navigator at the top level', () => {
  test('the package ships at least one source file to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    test(file.replace(packageRoot, ''), () => {
      const offenders = topLevelGlobalReads(readFileSync(file, 'utf8'));
      expect(offenders).toEqual([]);
    });
  }
});

test('the barrel imports without throwing', async () => {
  await expect(import('../index')).resolves.toBeDefined();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('createEditor throws a clear error when called with no browser', async () => {
  const { createEditor } = await import('../createEditor');
  const target = document.createElement('div');
  vi.stubGlobal('window', undefined);
  expect(() => createEditor(target)).toThrow(
    '[editor] createEditor needs a browser; call it on mount',
  );
});
