import type { Page } from 'src/schemas/PageSchema';
import { PAGES_COLLECTION_NAME, parsePage } from 'src/schemas/PageSchema';
import {
  SITES_COLLECTION_NAME,
  type Site,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError } from 'src/utils/logHelpers';
import { renderWikiContent } from 'src/utils/server/wiki/renderWikiContent';

export async function getSiteData(siteKey: string): Promise<Site | null> {
  try {
    const { serverDB } = await import('./index.js');
    const siteDoc = await serverDB
      .collection(SITES_COLLECTION_NAME)
      .doc(siteKey)
      .get();

    const siteData = siteDoc.data();

    if (!siteDoc.exists || !siteData) {
      return null;
    }

    return SiteSchema.parse({ ...toClientEntry(siteData), key: siteKey });
  } catch (error) {
    logError('getSiteData', 'Failed to fetch site:', error);
    return null;
  }
}

export async function getPageData(
  siteKey: string,
  pageKey: string,
  url: URL,
): Promise<Page | null> {
  try {
    const { serverDB } = await import('./index.js');
    const siteRef = serverDB.collection(SITES_COLLECTION_NAME).doc(siteKey);
    const pageRef = siteRef.collection(PAGES_COLLECTION_NAME).doc(pageKey);

    const [siteDoc, pageDoc] = await Promise.all([
      siteRef.get(),
      pageRef.get(),
    ]);

    const siteData = siteDoc.data();
    const pageData = pageDoc.data();

    if (!siteDoc.exists || !pageDoc.exists || !siteData || !pageData) {
      return null;
    }

    const site = SiteSchema.parse({
      ...toClientEntry(siteData),
      key: siteDoc.id,
    });
    const page = parsePage(toClientEntry(pageData), pageKey, siteKey);

    // Render wiki content
    page.htmlContent = await renderWikiContent(page, site, url);

    return page;
  } catch (error) {
    logError('getPageData', 'Failed to fetch page:', error);
    return null;
  }
}
