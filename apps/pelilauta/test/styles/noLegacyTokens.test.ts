import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Ensures that application files in apps/pelilauta/src read only published
 * tokens (--cn-*) and do not read deprecated legacy Cyan custom properties
 * (--color-*, --radius-*, --background-*).
 */
const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

function collectSourceFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(collectSourceFiles(fullPath));
    } else if (/\.(astro|svelte|css|ts|js)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('Legacy token absence contract', () => {
  const sourceFiles = collectSourceFiles(srcRoot);

  it('contains no reads of legacy --color-*, --radius-*, or --background-* custom properties', () => {
    const legacyVarRegex =
      /var\(\s*--(color|radius|background)-[a-zA-Z0-9-_]+/g;
    const violations: { file: string; match: string }[] = [];

    for (const file of sourceFiles) {
      const content = stripComments(readFileSync(file, 'utf8'));
      const matches = content.matchAll(legacyVarRegex);
      for (const match of matches) {
        violations.push({
          file: file.replace(srcRoot, 'src'),
          match: match[0],
        });
      }
    }

    expect(violations).toEqual([]);
  });
});
