import type { APIContext } from 'astro';
import {
  PAGES_COLLECTION_NAME,
  type Page,
  parsePage,
} from 'src/schemas/PageSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { serverDB } from '../../../../firebase/server';

export async function GET({ params }: APIContext): Promise<Response> {
  const { siteKey } = params;

  if (!siteKey) {
    return new Response('Invalid request', { status: 400 });
  }

  const pageDocs = await serverDB
    .collection(SITES_COLLECTION_NAME)
    .doc(siteKey)
    .collection(PAGES_COLLECTION_NAME)
    .get();

  const pages: Array<Page> = [];

  for (const pageDoc of pageDocs.docs) {
    pages.push(parsePage(toClientEntry(pageDoc.data()), pageDoc.id, siteKey));
  }

  return new Response(JSON.stringify(pages), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30',
      'CDN-Cache-Control': 'public, s-maxage=600',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  });
}
