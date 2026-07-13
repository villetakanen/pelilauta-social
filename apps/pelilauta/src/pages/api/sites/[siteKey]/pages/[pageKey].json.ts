import type { APIContext } from 'astro';
import { getPageData } from '../../../../../firebase/server/sites';
import { logError } from '../../../../../utils/logHelpers';

export async function GET({
  params,
  url,
  request,
}: APIContext): Promise<Response> {
  const { siteKey, pageKey } = params;

  if (!siteKey || !pageKey) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const page = await getPageData(siteKey, pageKey, url);

    if (!page) {
      return new Response('Page not found', { status: 404 });
    }

    // Generate ETag based on page's updatedAt timestamp
    const etag = `"${page.updatedAt}"`;

    // Check if client has current version
    if (request.headers.get('If-None-Match') === etag) {
      return new Response(null, { status: 304 });
    }

    // Return the page data and 200 OK
    return new Response(JSON.stringify(page), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ETag: etag,
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300', // 1min/5min
      },
    });
  } catch (err: unknown) {
    logError('pages.json.ts', err);
    return new Response('Internal server error', { status: 500 });
  }
}
