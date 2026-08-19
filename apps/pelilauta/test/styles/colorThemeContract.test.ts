import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const stylesRoot = fileURLToPath(
  new URL('../../../../packages/design-system/styles', import.meta.url),
);

/**
 * Locate an installed package directory without assuming the pnpm store layout.
 * Under `node-linker=hoisted` a dependency exists only in the workspace-root
 * `node_modules`, not the app's, so a hardcoded app-relative path throws ENOENT.
 * Throws rather than returning nothing: an empty read would make these contract
 * tests pass while covering no installed source at all.
 */
function installedDir(relative: string): string {
  const candidates = [
    join(appRoot, 'node_modules', relative),
    join(workspaceRoot, 'node_modules', relative),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      `Installed source not found for '${relative}'. Looked in:\n  ${candidates.join('\n  ')}`,
    );
  }
  return found;
}

const installedCyanDirs = [
  '@11thdeg/cyan-css/src',
  '@11thdeg/cyan-lit',
  '@11thdeg/cn-story-clock',
  '@11thdeg/cn-d20-ability-score',
];

const expectedReferences = {
  '--chroma-primary-0': 'oklch(0 0 185)',
  '--chroma-primary-10': 'oklch(0.12 0.09 185)',
  '--chroma-primary-20': 'oklch(0.2 0.14 180)',
  '--chroma-primary-30': 'oklch(0.3 0.18 175)',
  '--chroma-primary-40': 'oklch(0.4 0.22 170)',
  '--chroma-primary-50': 'oklch(0.5 0.24 162)',
  '--chroma-primary-60': 'oklch(0.6 0.26 150)',
  '--chroma-primary-70': 'oklch(0.7 0.27 135)',
  '--chroma-primary-80': 'oklch(0.8 0.27 120)',
  '--chroma-primary-90': 'oklch(0.9 0.27 110)',
  '--chroma-primary-95': 'oklch(0.95 0.18 110)',
  '--chroma-primary-99': 'oklch(0.99 0.05 110)',
  '--chroma-primary-100': 'oklch(1 0 110)',
  '--chroma-surface-0': 'oklch(0 0 242)',
  '--chroma-surface-10': 'oklch(0.1 0.05 242)',
  '--chroma-surface-20': 'oklch(0.2 0.07 242)',
  '--chroma-surface-30': 'oklch(0.3 0.09 242)',
  '--chroma-surface-40': 'oklch(0.4 0.12 242)',
  '--chroma-surface-50': 'oklch(0.5 0.14 242)',
  '--chroma-surface-60': 'oklch(0.6 0.17 242)',
  '--chroma-surface-70': 'oklch(0.7 0.17 242)',
  '--chroma-surface-80': 'oklch(0.8 0.12 242)',
  '--chroma-surface-90': 'oklch(0.9 0.06 242)',
  '--chroma-surface-95': 'oklch(0.95 0.03 242)',
  '--chroma-surface-99': 'oklch(0.99 0.015 242)',
  '--chroma-surface-100': 'oklch(1 0 242)',
  '--chroma-error-20': 'oklch(0.2 0.15 318)',
  '--chroma-error-40': 'oklch(0.4 0.18 318)',
  '--chroma-error-60': 'oklch(0.6 0.2 318)',
  '--chroma-error-90': 'oklch(0.9 0.1 318)',
  '--chroma-warning-20': 'oklch(0.2 0.15 65)',
  '--chroma-warning-40': 'oklch(0.4 0.2 65)',
  '--chroma-warning-60': 'oklch(0.6 0.25 65)',
  '--chroma-warning-90': 'oklch(0.9 0.2 65)',
  '--chroma-love-20': 'oklch(0.2 0.15 30)',
  '--chroma-love-40': 'oklch(0.4 0.18 30)',
  '--chroma-love-60': 'oklch(0.6 0.2 30)',
  '--chroma-love-90': 'oklch(0.9 0.1 30)',
} as const;

const declarationPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
const usagePattern = /var\((--[\w-]+)/g;

// --color-on is intentionally left undefined. Legacy Cyan cn-icon consumes it as var(--color-on, currentColor), so leaving it undefined lets icons inherit their contextual foreground. Defining it globally breaks that inheritance.
const intentionallyUndefined = new Set(['--color-on']);
const sourceExtensions = new Set(['.astro', '.css', '.js', '.svelte', '.ts']);
const colorPrefixes = [
  '--background-',
  '--chroma-',
  '--cn-active',
  '--cn-backdrop',
  '--cn-border',
  '--cn-bubble',
  '--cn-button',
  '--cn-color-',
  '--cn-fab',
  '--cn-focus',
  '--cn-hover',
  '--cn-input',
  '--cn-lightbox',
  '--cn-link',
  '--cn-loader-color',
  '--cn-on-',
  '--cn-reply',
  '--cn-selection',
  '--cn-shadow',
  '--cn-surface',
  '--cn-text',
  '--color-',
];

function declarations(source: string) {
  return new Map(
    [...source.matchAll(declarationPattern)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function readSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readSources(path);
    return sourceExtensions.has(extname(entry.name))
      ? [readFileSync(path, 'utf8')]
      : [];
  });
}

function isColorProperty(property: string) {
  if (/(?:radius|size|width|physical)/.test(property)) return false;
  return colorPrefixes.some((prefix) => property.startsWith(prefix));
}

function usedColorProperties(sources: string[]) {
  return new Set(
    sources.flatMap((source) =>
      [...source.matchAll(usagePattern)]
        .map((match) => match[1])
        .filter(isColorProperty),
    ),
  );
}

function resolutionErrors(
  property: string,
  available: Map<string, string>,
  stack: string[] = [],
): string[] {
  if (stack.includes(property))
    return [`cycle: ${[...stack, property].join(' -> ')}`];

  const value = available.get(property);
  if (!value) return [`missing: ${property}`];

  const dependencies = [...value.matchAll(usagePattern)]
    .map((match) => match[1])
    .filter(isColorProperty);
  return dependencies.flatMap((dependency) =>
    resolutionErrors(dependency, available, [...stack, property]),
  );
}

describe('v20 color theme contract', () => {
  it('contains the 42 exact approved v20 reference colors', () => {
    const source = readFileSync(join(stylesRoot, 'chroma.css'), 'utf8');
    const actual = declarations(source);

    expect(actual.size).toBe(38);
    expect(Object.fromEntries(actual)).toEqual(expectedReferences);
  });

  it('loads reference, semantic, and compatibility layers in order', () => {
    const source = readFileSync(join(stylesRoot, 'color.css'), 'utf8');

    expect(source.trim().split('\n')).toEqual([
      '@import "./chroma.css";',
      '@import "./color-reference.css";',
      '@import "./color-theme.css";',
      '@import "./compat/cyan-4.css";',
    ]);
  });

  it('locally defines every color property consumed directly by Pelilauta', () => {
    const appSources = readSources(join(appRoot, 'src'));
    const styleSources = readSources(stylesRoot);
    const localDeclarations = declarations(
      [...styleSources, ...appSources].join('\n'),
    );
    const usedProperties = usedColorProperties(appSources);
    const missing = [...usedProperties].filter(
      (property) => !localDeclarations.has(property),
    );

    expect(missing).toEqual([]);
  });

  it('resolves application and installed Cyan color aliases without cycles', () => {
    const installedSources = installedCyanDirs.flatMap((directory) =>
      readSources(installedDir(directory)),
    );
    const appSources = readSources(join(appRoot, 'src'));
    const styleSources = readSources(stylesRoot);
    const available = declarations(
      [...installedSources, ...styleSources, ...appSources].join('\n'),
    );
    const usedProperties = usedColorProperties([
      ...installedSources,
      ...appSources,
    ]);
    const errors = [...usedProperties]
      .filter((property) => !intentionallyUndefined.has(property))
      .flatMap((property) => resolutionErrors(property, available));

    expect([...new Set(errors)].sort()).toEqual([]);
  });

  it('leaves --color-on intentionally undefined with a currentColor fallback', () => {
    const installedSources = installedCyanDirs.flatMap((directory) =>
      readSources(installedDir(directory)),
    );
    const appSources = readSources(join(appRoot, 'src'));
    const styleSources = readSources(stylesRoot);
    const available = declarations(
      [...installedSources, ...styleSources, ...appSources].join('\n'),
    );

    // Undefined by design: no layer may define the bare property.
    expect(available.has('--color-on')).toBe(false);

    // Every consumer must fall back to currentColor so icons inherit context.
    const usagesWithoutFallback = [
      ...installedSources,
      ...appSources,
      ...styleSources,
    ]
      .flatMap((source) => [
        ...source.matchAll(/var\(\s*--color-on\s*(,[^)]*)?\)/g),
      ])
      .filter((match) => !/,\s*currentColor\b/.test(match[1] ?? ''))
      .map((match) => match[0]);

    expect(usagesWithoutFallback).toEqual([]);
  });

  it('keeps application styles on semantic properties instead of raw chroma', () => {
    const appSource = readSources(join(appRoot, 'src')).join('\n');

    expect(appSource).not.toMatch(/var\(--chroma-/);
  });

  it('imports the design-system tokens after Cyan 4 in both document heads', () => {
    // Order is load-bearing: the design system wins at equal specificity only
    // because it is imported second. tokens.css supersedes the former direct
    // color.css import, and pulls in units.css first so the grid-derived
    // elevation shadows in color-theme.css can resolve.
    for (const head of ['BaseHead.astro', 'EditorHead.astro']) {
      const source = readFileSync(
        join(appRoot, 'src/components/server/BaseHead', head),
        'utf8',
      );
      const cyanIndex = source.indexOf("import '@11thdeg/cyan-css';");
      const tokensIndex = source.indexOf(
        "import '@design-system/styles/ds.css';",
      );

      expect(cyanIndex).toBeGreaterThan(-1);
      expect(tokensIndex).toBeGreaterThan(cyanIndex);
    }
  });
});
