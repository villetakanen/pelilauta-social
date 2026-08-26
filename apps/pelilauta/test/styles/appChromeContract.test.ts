import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The chrome layer and the tray it holds are two artifacts that must agree.
 *
 * specs/design-system/fab-tray/spec.md places the tray against a container whose
 * border box is the dynamic viewport, and the design system positions it with
 * `absolute`. The application supplies that container. Drop `position: fixed` or the
 * container declaration from the layer and the tray silently resolves against the
 * document instead, pinning to the bottom of the page — a failure no book page can
 * show, because a specimen brings its own container.
 */
const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const chromePath = join(appRoot, 'src/components/server/app/AppChrome.astro');
const fabPath = join(appRoot, '../../packages/design-system/styles/fab.css');

function compact(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('App chrome layer', () => {
  const chrome = compact(readFileSync(chromePath, 'utf8'));
  const fab = compact(readFileSync(fabPath, 'utf8'));

  it('is the viewport-sized container the tray resolves against', () => {
    expect(chrome).toContain(
      '.app-chrome { position: fixed; inset: 0; z-index: var(--cn-z-fab); container: app-chrome / inline-size; pointer-events: none; }',
    );
  });

  it('holds the layer against what the design system positions', () => {
    // The tray is absolute, so the layer has to be its containing block. Either
    // half changing alone is the drift this test exists for.
    expect(fab).toMatch(/nav\.fab-tray \{[^}]*position: absolute;/);
  });
});
