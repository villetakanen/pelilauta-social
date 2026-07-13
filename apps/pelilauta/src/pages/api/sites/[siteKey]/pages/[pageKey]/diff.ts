import type { APIContext } from 'astro';
import { PageHistorySchema } from 'src/schemas/PageHistorySchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { logError } from 'src/utils/logHelpers';

export async function GET({ params }: APIContext): Promise<Response> {
  const { siteKey, pageKey } = params;

  if (!siteKey || !pageKey) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const { serverDB } = await import('../../../../../../firebase/server');
    const historyDocRef = serverDB
      .collection(SITES_COLLECTION_NAME)
      .doc(siteKey)
      .collection('history')
      .doc(pageKey);

    const historyDoc = await historyDocRef.get();

    if (!historyDoc.exists) {
      return new Response('Page history not found', { status: 404 });
    }

    const pageHistory = PageHistorySchema.parse(historyDoc.data());

    return new Response(JSON.stringify(pageHistory), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // No cache, as pages can be edited
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: unknown) {
    logError('Error fetching page diff:', err);
  }

  return new Response(JSON.stringify({ error: 'Not implemented yet' }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
