import type { APIContext } from 'astro';
import { marked } from 'marked';
import {
  HANDOUTS_COLLECTION_NAME,
  handoutFrom,
} from 'src/schemas/HandoutSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { serverDB } from '../../../../../firebase/server';

export async function GET({ params }: APIContext): Promise<Response> {
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

    handout.htmlContent = await marked(handout.markdownContent || '... \n');

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
