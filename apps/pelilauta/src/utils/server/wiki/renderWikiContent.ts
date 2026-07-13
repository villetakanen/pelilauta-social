import type { Page } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { renderAssetMarkup } from '../renderAssetMarkup';
import { renderDice } from '../renderDice';
import { renderTags } from '../renderTags';

export async function renderWikiContent(page: Page, site: Site, url: URL) {
  const { getMarkedInstance } = await import('src/utils/shared/getMarked');
  const marked = getMarkedInstance(url.origin, { site });

  // Legacy pages might not have markdown content, so we'll fall back to
  // contents saved by earlier versions of the App.
  if (!page.markdownContent) return page.htmlContent || page.content || '';

  const hashTags = renderTags(page.markdownContent, url.origin);
  const assetLinks = renderAssetMarkup(hashTags, site, url.origin);
  const diceLinks = renderDice(assetLinks);
  const htmlContent = await marked.parse(diceLinks || '');

  return htmlContent;
}
