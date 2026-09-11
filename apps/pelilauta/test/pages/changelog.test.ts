import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderChangelog } from '../../src/utils/server/renderChangelog';

/**
 * The page bundles the release record the repository carries. Dropping the
 * `@root/CHANGELOG.md?raw` import, or reading `Base.astro` from elsewhere,
 * would silently serve a stale or unstyled page.
 */
const appRoot = fileURLToPath(new URL('../..', import.meta.url));
const repoRoot = join(appRoot, '../..');
const pagePath = join(appRoot, 'src/pages/changelog.html.astro');

describe('changelog page', () => {
  it('imports the root changelog and the base layout', () => {
    const source = readFileSync(pagePath, 'utf8');
    expect(source).toContain("import changelog from '@root/CHANGELOG.md?raw'");
    expect(source).toContain("import Base from '@layouts/Base.astro'");
  });

  it('renders a heading for the version the package declares, so the two cannot drift', () => {
    const markdown = readFileSync(join(repoRoot, 'CHANGELOG.md'), 'utf8');
    const { version } = JSON.parse(
      readFileSync(join(repoRoot, 'package.json'), 'utf8'),
    );

    const html = renderChangelog(markdown);
    const heading = /<h2>([^<]*)<\/h2>/.exec(html);

    expect(heading).not.toBeNull();
    expect(heading?.[1].startsWith(version)).toBe(true);
  });
});
