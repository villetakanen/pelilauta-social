import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const migrationPath = join(appRoot, 'src/styles/migrations/cyan-icon.css');

function compact(source: string) {
  return withoutComments(source).replace(/\s+/g, ' ').trim();
}

function withoutComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('Cyan Icon migration contract', () => {
  it('keeps the reached contextual rules in the application migration layer', () => {
    const source = compact(readFileSync(migrationPath, 'utf8'));

    expect(source).toContain(
      ':where(button, a.button, .fab) .cn-icon { --cn-icon-size-xsmall: var(--cn-icon-size-small); --cn-icon-size: var(--cn-icon-size-small); --cn-icon-size-large: var(--cn-icon-size-small); --cn-icon-size-xlarge: var(--cn-icon-size-small); }',
    );
    expect(source).toContain(
      'button .cn-icon:first-child:not(:only-child), a.button .cn-icon:first-child:not(:only-child) { margin-left: calc(var(--cn-grid) * -1); }',
    );
    expect(source).toContain(
      'button .cn-icon:only-child, a.button .cn-icon:only-child { margin-top: 1px; margin-right: -9px; margin-left: -9px; }',
    );
    expect(source).toContain(
      'button.fab .cn-icon:first-child:not(:only-child), a.button.fab .cn-icon:first-child:not(:only-child) { margin-left: 0; }',
    );
    expect(source).toContain('.flex.items-start > .cn-icon { flex-grow: 0; }');
    expect(source).toContain('h3 .cn-icon { vertical-align: middle; }');
  });

  it('loads after stable Icon CSS and before application overrides', () => {
    const source = withoutComments(
      readFileSync(
        join(appRoot, 'src/components/server/BaseHead/BaseHead.astro'),
        'utf8',
      ),
    );
    const cyanIndex = source.indexOf("import '@11thdeg/cyan-css';");
    // Icon sizing tokens reach the document through the design system's token
    // entry point; they were a separate icon.css import until they were folded in.
    const tokensIndex = source.indexOf(
      "import '@design-system/styles/ds.css';",
    );
    const migrationIndex = source.indexOf(
      "import '../../../styles/migrations/cyan-icon.css';",
    );
    const overridesIndex = source.indexOf("import '../../../overrides.css';");

    expect(cyanIndex).toBeGreaterThan(-1);
    expect(tokensIndex).toBeGreaterThan(cyanIndex);
    expect(migrationIndex).toBeGreaterThan(tokensIndex);
    expect(overridesIndex).toBeGreaterThan(migrationIndex);
  });
});
