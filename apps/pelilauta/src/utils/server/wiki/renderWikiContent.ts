import type { Page } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { renderMarkdown } from 'src/utils/shared/renderMarkdown';
import { sanitizeHtml } from 'src/utils/shared/sanitizeHtml';

export function renderWikiContent(page: Page, site: Site, url: URL): string {
  // Legacy pages might not have markdown content, so we'll fall back to
  // contents saved by earlier versions of the App.
  if (!page.markdownContent) {
    return sanitizeHtml(page.htmlContent || page.content || '');
  }

  return renderMarkdown(page.markdownContent, {
    origin: url.origin,
    site: { key: site.key, assets: site.assets },
    hashtags: true,
  });
}
