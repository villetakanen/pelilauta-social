import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const styles = new URL('../styles/', import.meta.url);
const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));
const compat = readFileSync(
  new URL('compat/cyan-typography.css', styles),
  'utf8',
);

function sourcesBelow(root: string): string {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.js'))
    .map((path) => readFileSync(join(root, path), 'utf8'))
    .join('\n');
}

function installed(relative: string): string {
  const candidates = [
    join(packageRoot, 'node_modules', relative),
    join(workspaceRoot, 'node_modules', relative),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Installed source not found for '${relative}'`);
  }
  return found;
}

/*
 * Read by Cyan and left undefined on purpose. Cyan declares it nowhere, so its own
 * `line-height: var(--cn-line-height-ui)` rules are invalid at computed-value time
 * and the leading inherits. Declaring it would tighten every text input.
 */
const DELIBERATELY_UNDEFINED = ['--cn-line-height-ui'];

describe('Cyan Lit typography compatibility', () => {
  test('declares every legacy UI and h5 property read by the installed package', () => {
    const source = sourcesBelow(installed('@11thdeg/cyan-lit/dist'));
    const legacyReads = [
      ...new Set(
        [...source.matchAll(/var\(\s*(--cn-[\w-]+(?:-ui|-h5))\s*[,)]/g)].map(
          ([, name]) => name,
        ),
      ),
    ];
    const declared = new Set(
      [...compat.matchAll(/(--cn-[\w-]+)\s*:/g)].map(([, name]) => name),
    );

    // Every exclusion is a name Cyan actually reads, so a stale one fails here
    // rather than quietly shrinking what this test covers.
    expect(legacyReads).toEqual(expect.arrayContaining(DELIBERATELY_UNDEFINED));

    const required = legacyReads
      .filter((name) => !DELIBERATELY_UNDEFINED.includes(name))
      .sort();

    expect([...declared].sort()).toEqual(required);
  });

  test('loads after the faces and before document containers', () => {
    const entry = readFileSync(new URL('ds.css', styles), 'utf8');
    const imports = [...entry.matchAll(/@import\s+"([^"]+)"/g)].map(
      ([, path]) => path,
    );

    expect(imports).toEqual([
      './preflight.css',
      './tokens.css',
      './fonts.css',
      './typography.css',
      './compat/cyan-typography.css',
      './content-containers.css',
    ]);
  });
});
