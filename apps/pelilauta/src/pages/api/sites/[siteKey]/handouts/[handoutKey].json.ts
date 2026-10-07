import type { APIContext } from 'astro';
import {
  HANDOUTS_COLLECTION_NAME,
  handoutFrom,
} from 'src/schemas/HandoutSchema';
import { SITES_COLLECTION_NAME, SiteSchema } from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { renderMarkdown } from 'src/utils/shared/renderMarkdown';
import { serverDB } from '../../../../../firebase/server';

export async function GET({ params, url }: APIContext): Promise<Response> {
  const { siteKey, handoutKey } = params;

  if (!siteKey || !handoutKey) {
    return new Response('Invalid request', { status: 400 });
  }

  const pagesCollection = serverDB
    .collection(SITES_COLLECTION_NAME)
    .doc(siteKey)
    .collection(HANDOUTS_COLLECTION_NAME);
  const handoutDoc = await pagesCollection.doc(handoutKey).get();

  const data = handoutDoc.data();

  if (!handoutDoc.exists || !data) {
    return new Response('Handout not found', { status: 404 });
  }

  try {
    const handout = handoutFrom(toClientEntry(data), handoutKey, siteKey);

    const siteDoc = await serverDB
      .collection(SITES_COLLECTION_NAME)
      .doc(siteKey)
      .get();
    const siteData = siteDoc.data();
    const site = siteData
      ? SiteSchema.parse({ ...toClientEntry(siteData), key: siteKey })
      : undefined;

    handout.htmlContent = renderMarkdown(handout.markdownContent || '... \n', {
      origin: url.origin,
      site: site ? { key: site.key, assets: site.assets } : { key: siteKey },
    });

    return new Response(JSON.stringify(handout), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // No cache, as handouts can be edited
      },
    });
  } catch (_err: unknown) {
    return new Response('Invalid handout data', { status: 500 });
  }
}
