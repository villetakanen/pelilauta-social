import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The footer's version link takes a reader to the changelog. Reverting it
 * to the retired `/docs/80-release-notes` route would silently 404.
 */
const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const footerPath = join(appRoot, 'src/base/chrome/BaseFooter.astro');

describe('BaseFooter', () => {
  const source = readFileSync(footerPath, 'utf8');

  it('links the version to the changelog page', () => {
    expect(source).toContain('<a href="/changelog.html">{version}</a>');
  });

  it('carries no reference to the retired release-notes route', () => {
    expect(source).not.toContain('release-notes');
  });
});
