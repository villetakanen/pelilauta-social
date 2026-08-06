import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const migration = readFileSync(
  join(appRoot, 'src/styles/migrations/cyan-elements.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');
const compact = migration.replace(/\s+/g, ' ').trim();

describe('Cyan element migration contract', () => {
  it('keeps a bridge for every reached element context', () => {
    const contexts = [
      'cn-bubble',
      'cn-loader',
      'cn-menu',
      'cn-lightbox',
      'cn-reaction-button',
      'cn-sortable-list',
      'cn-toggle-button',
      'cn-d20-ability-score',
      'cn-dice',
      'cn-navigation-icon',
      'cn-tray-button',
      'cn-app-bar',
    ];

    for (const context of contexts) {
      expect(migration, context).toContain(context);
    }

    expect(compact).toContain(
      'cn-bubble .toolbar:first-child { margin-top: calc(-1 * var(--cn-gap)); }',
    );
    expect(compact).toContain(
      'main :where(cn-menu) ul { list-style-type: none; margin: 0; padding: 0; display: flex; flex-direction: column; }',
    );
    expect(compact).toContain(
      'cn-sortable-list { display: block; font-family: var(--cn-font-family-ui); font-weight: var(--cn-font-weight-ui); font-size: var(--cn-font-size-ui); letter-spacing: var(--cn-letter-spacing-ui); }',
    );

    // Cyan declares --cn-line-height-ui nowhere, so restating its read here would
    // change a text input's leading the moment anything declares it.
    expect(migration).not.toContain('--cn-line-height-ui');
    expect(compact).toContain(
      'body:has(cn-tray-button[aria-expanded="false"]) nav#tray { transform: translateX(100%); }',
    );
  });

  it('keeps no bridge for an element the application no longer renders', () => {
    // CnCard is a local component and no `cn-card` element is left in the
    // application, so a rule reappearing here would be styling nothing — and
    // would read as a live dependency to whoever finds it.
    expect(migration).not.toMatch(/\bcn-card\b/);
  });

  it('does not copy selectors that cannot cross a component shadow root', () => {
    expect(migration).not.toMatch(/cn-sortable-list\s+(?:ul|\.item|\.title)/);
    expect(migration).not.toContain('.cyan-accordion');
    expect(migration).not.toContain('cn-editor');
    expect(migration).not.toMatch(/\bcn-icon\b/);
    expect(migration).not.toContain('@import');
  });

  it.each(['BaseHead.astro', 'EditorHead.astro'])(
    'loads the bridge between the design system and overrides in %s',
    (head) => {
      const source = readFileSync(
        join(appRoot, 'src/components/server/BaseHead', head),
        'utf8',
      );
      const designSystem = source.indexOf(
        "import '@design-system/styles/ds.css';",
      );
      const bridge = source.indexOf(
        "import '../../../styles/migrations/cyan-elements.css';",
      );
      const overrides = source.indexOf("import '../../../overrides.css';");

      expect(designSystem).toBeGreaterThan(-1);
      expect(bridge).toBeGreaterThan(designSystem);
      expect(overrides).toBeGreaterThan(bridge);
    },
  );
});
