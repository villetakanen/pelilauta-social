import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const stylesRoot = fileURLToPath(
  new URL('../../../../packages/design-system/styles', import.meta.url),
);

const expectedReferences = {
  '--cn-color-primary-0': 'oklch(0 0 185)',
  '--cn-color-primary-10': 'oklch(0.12 0.09 185)',
  '--cn-color-primary-20': 'oklch(0.2 0.14 180)',
  '--cn-color-primary-30': 'oklch(0.3 0.18 175)',
  '--cn-color-primary-40': 'oklch(0.4 0.22 170)',
  '--cn-color-primary-50': 'oklch(0.5 0.24 162)',
  '--cn-color-primary-60': 'oklch(0.6 0.26 150)',
  '--cn-color-primary-70': 'oklch(0.7 0.27 135)',
  '--cn-color-primary-80': 'oklch(0.8 0.27 120)',
  '--cn-color-primary-90': 'oklch(0.9 0.27 110)',
  '--cn-color-primary-95': 'oklch(0.95 0.18 110)',
  '--cn-color-primary-99': 'oklch(0.99 0.05 110)',
  '--cn-color-primary-100': 'oklch(1 0 110)',
  '--cn-color-surface-0': 'oklch(0 0 242)',
  '--cn-color-surface-10': 'oklch(0.1 0.05 242)',
  '--cn-color-surface-20': 'oklch(0.2 0.07 242)',
  '--cn-color-surface-30': 'oklch(0.3 0.09 242)',
  '--cn-color-surface-40': 'oklch(0.4 0.12 242)',
  '--cn-color-surface-50': 'oklch(0.5 0.14 242)',
  '--cn-color-surface-60': 'oklch(0.6 0.17 242)',
  '--cn-color-surface-70': 'oklch(0.7 0.17 242)',
  '--cn-color-surface-80': 'oklch(0.8 0.12 242)',
  '--cn-color-surface-90': 'oklch(0.9 0.06 242)',
  '--cn-color-surface-95': 'oklch(0.95 0.03 242)',
  '--cn-color-surface-99': 'oklch(0.99 0.015 242)',
  '--cn-color-surface-100': 'oklch(1 0 242)',
  '--cn-color-error-20': 'oklch(0.2 0.15 318)',
  '--cn-color-error-40': 'oklch(0.4 0.18 318)',
  '--cn-color-error-60': 'oklch(0.6 0.2 318)',
  '--cn-color-error-90': 'oklch(0.9 0.1 318)',
  '--cn-color-warning-20': 'oklch(0.2 0.15 65)',
  '--cn-color-warning-40': 'oklch(0.4 0.2 65)',
  '--cn-color-warning-60': 'oklch(0.6 0.25 65)',
  '--cn-color-warning-90': 'oklch(0.9 0.2 65)',
  '--cn-color-info-20': 'oklch(0.2 0.12 170)',
  '--cn-color-info-40': 'oklch(0.4 0.15 170)',
  '--cn-color-info-60': 'oklch(0.6 0.18 170)',
  '--cn-color-info-90': 'oklch(0.9 0.1 170)',
  '--cn-color-love-20': 'oklch(0.2 0.15 30)',
  '--cn-color-love-40': 'oklch(0.4 0.18 30)',
  '--cn-color-love-60': 'oklch(0.6 0.2 30)',
  '--cn-color-love-90': 'oklch(0.9 0.1 30)',
} as const;

const declarationPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
const usagePattern = /var\((--[\w-]+)/g;
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
    const source = readFileSync(
      join(stylesRoot, 'color-reference.css'),
      'utf8',
    );
    const actual = declarations(source);

    expect(actual.size).toBe(42);
    expect(Object.fromEntries(actual)).toEqual(expectedReferences);
  });

  it('loads reference, semantic, and compatibility layers in order', () => {
    const source = readFileSync(join(stylesRoot, 'color.css'), 'utf8');

    expect(source.trim().split('\n')).toEqual([
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
    const installedSources = [
      'node_modules/@11thdeg/cyan-css/src',
      'node_modules/@11thdeg/cyan-lit',
      'node_modules/@11thdeg/cn-story-clock',
      'node_modules/@11thdeg/cn-d20-ability-score',
    ].flatMap((directory) => readSources(join(appRoot, directory)));
    const appSources = readSources(join(appRoot, 'src'));
    const styleSources = readSources(stylesRoot);
    const available = declarations(
      [...installedSources, ...styleSources, ...appSources].join('\n'),
    );
    const usedProperties = usedColorProperties([
      ...installedSources,
      ...appSources,
    ]);
    const errors = [...usedProperties].flatMap((property) =>
      resolutionErrors(property, available),
    );

    expect([...new Set(errors)].sort()).toEqual([]);
  });

  it('keeps application styles on semantic properties instead of raw chroma', () => {
    const appSource = readSources(join(appRoot, 'src')).join('\n');

    expect(appSource).not.toMatch(/var\(--chroma-/);
  });

  it('imports the theme after Cyan 4 in both document heads', () => {
    for (const head of ['BaseHead.astro', 'EditorHead.astro']) {
      const source = readFileSync(
        join(appRoot, 'src/components/server/BaseHead', head),
        'utf8',
      );
      const cyanIndex = source.indexOf("import '@11thdeg/cyan-css';");
      const themeIndex = source.indexOf(
        "import '@design-system/styles/color.css';",
      );

      expect(cyanIndex).toBeGreaterThan(-1);
      expect(themeIndex).toBeGreaterThan(cyanIndex);
    }
  });
});
