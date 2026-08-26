/**
 * Package unit tests for the icon capability.
 *
 * The icon contract is enumerable data — a noun resolves to artwork through a
 * fixed tier order — so it is asserted here without rendering anything. Browser
 * checks cover only what needs a cascade and layout.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { getIcon as getManagedIcon } from '../../myrrys-proprietary/index.ts';
import { FallbackIcons } from '../components/icon-fallback.ts';
import {
  getIcon as getOpenSourceIcon,
  getNouns as openSourceNouns,
} from '../icons/open-source.ts';

// Mirror of the component's resolution order (open-source -> managed -> fallback
// -> missing) so precedence is asserted independently of Svelte rendering.
function resolveTier(
  noun: string,
): 'open-source' | 'managed' | 'fallback' | 'missing' {
  if (getOpenSourceIcon(noun)) return 'open-source';
  if (getManagedIcon(noun)) return 'managed';
  if (FallbackIcons[noun]) return 'fallback';
  return 'missing';
}

test('open-source tier owns the openly licensed UI nouns', () => {
  for (const noun of [
    'fox',
    'search',
    'arrow-left',
    'add',
    'arrow-up',
    'arrow-down',
    'card',
    'chevron-left',
    'clock',
    'close',
    'dots',
    'drag',
    'dragger',
  ]) {
    expect(resolveTier(noun), `${noun} should resolve to open-source`).toBe(
      'open-source',
    );
    expect(openSourceNouns(), `${noun} in open-source registry`).toContain(
      noun,
    );
  }
});

test('every open-source icon is monochrome currentColor (no hardcoded fill)', () => {
  for (const noun of openSourceNouns()) {
    const inner = getOpenSourceIcon(noun)!.inner;
    expect(inner, `${noun} declares currentColor`).toMatch(/currentColor/);
    expect(inner, `${noun} has no hardcoded hex fill`).not.toMatch(
      /#[0-9a-fA-F]{3,6}/,
    );
  }
});

test('open-source artwork and provenance rows are in exact parity', () => {
  const directory = new URL('../icons/open-source/', import.meta.url);
  const artwork = readdirSync(directory)
    .filter((name) => name.endsWith('.svg'))
    .map((name) => name.slice(0, -4))
    .sort();
  const provenance = readFileSync(
    new URL('../icons/open-source/PROVENANCE.md', import.meta.url),
    'utf8',
  );
  const nounTable = provenance.split('| Noun | Source | Notes |')[1];
  expect(nounTable, 'provenance noun table is present').toBeTruthy();
  const rows = [...nounTable.matchAll(/^\| `([^`]+)` \| ([^|]+) \|/gm)];
  const nouns = rows.map((row) => row[1]);

  expect(new Set(nouns).size, 'provenance nouns are unique').toBe(nouns.length);
  expect(
    rows.every((row) => row[2].trim().length > 0),
    'every provenance row records a source',
  ).toBe(true);
  expect(
    rows.every((row) =>
      /^\*\*(?:Project-created|Third-party, [^*]+)\.\*\*/.test(row[2].trim()),
    ),
    'every provenance row identifies its source kind',
  ).toBe(true);
  expect(nouns.sort()).toEqual(artwork);
});

test('managed tier owns the branded featured-tag nouns', () => {
  for (const noun of ['dd5', 'pathfinder', 'll-ampersand', 'pbta-logo']) {
    expect(resolveTier(noun), `${noun} should resolve to managed`).toBe(
      'managed',
    );
  }
});

test('unknown, empty, and absent nouns fall to the missing glyph', () => {
  expect(resolveTier('no-such-noun-xyz')).toBe('missing');
  expect(resolveTier('')).toBe('missing');
  expect(FallbackIcons.missing).toBeTruthy();
  expect(FallbackIcons.missing.paths.length).toBeGreaterThan(0);
});

test('bundled fallback tier provides the essential UI symbols', () => {
  for (const noun of ['menu', 'account']) {
    expect(resolveTier(noun), `${noun} should resolve to fallback`).toBe(
      'fallback',
    );
  }
});

test('open-source registry generation is deterministic (--check passes)', () => {
  const script = fileURLToPath(
    new URL('../scripts/generate-icon-registry.mjs', import.meta.url),
  );
  // Throws (non-zero exit) if the committed registry is stale.
  expect(() =>
    execFileSync('node', [script, '--check'], { stdio: 'pipe' }),
  ).not.toThrow();
});
