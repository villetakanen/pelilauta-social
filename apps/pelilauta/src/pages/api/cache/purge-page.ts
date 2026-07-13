import type { APIContext } from 'astro';
import { getSiteData } from '../../../firebase/server/sites';
import { handlePageUpdate } from '../../../lib/server/content-hooks';
import { logDebug, logError } from '../../../utils/logHelpers';
import { tokenToUid } from '../../../utils/server/auth/tokenToUid';

/**
 * API route for purging cache when a page is updated.
 * This is called by client-side update functions after page content changes.
 */
export async function POST({ request }: APIContext): Promise<Response> {
  try {
    // Authenticate the request
    const uid = await tokenToUid(request);
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { siteKey, pageKey } = body;

    if (!siteKey || !pageKey) {
      return new Response('Missing siteKey or pageKey', { status: 400 });
    }

    logDebug('purge-page API', 'Cache purge requested', {
      siteKey,
      pageKey,
      uid,
    });

    // Get site data to check homepage and user authorization
    const site = await getSiteData(siteKey);

    if (!site) {
      return new Response('Site not found', { status: 404 });
    }

    // Check if user is authorized to trigger cache purging for this site
    // (only owners can modify content and thus purge cache)
    if (!site.owners.includes(uid)) {
      logDebug('purge-page API', 'User not authorized for site', {
        siteKey,
        uid,
        owners: site.owners,
      });
      return new Response('Forbidden', { status: 403 });
    }

    // Trigger the cache purging workflow
    await handlePageUpdate(siteKey, pageKey, site);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cache purge initiated',
        siteKey,
        pageKey,
        isHomepage: pageKey === site.homepage,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    logError('purge-page API', 'Failed to purge page cache', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
