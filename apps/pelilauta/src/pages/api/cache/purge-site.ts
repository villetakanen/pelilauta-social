import type { APIContext } from 'astro';
import { getSiteData } from '../../../firebase/server/sites';
import { handleSiteUpdate } from '../../../lib/server/content-hooks';
import { logDebug, logError } from '../../../utils/logHelpers';
import { tokenToUid } from '../../../utils/server/auth/tokenToUid';

/**
 * API route for purging site-wide cache when site metadata is updated.
 * This is called by client-side update functions after site changes.
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
    const { siteKey } = body;

    if (!siteKey) {
      return new Response('Missing siteKey', { status: 400 });
    }

    logDebug('purge-site API', 'Site-wide cache purge requested', {
      siteKey,
      uid,
    });

    // Get site data to check user authorization
    const site = await getSiteData(siteKey);

    if (!site) {
      return new Response('Site not found', { status: 404 });
    }

    // Check if user is authorized to trigger cache purging for this site
    // (only owners can modify site settings and thus purge cache)
    if (!site.owners.includes(uid)) {
      logDebug('purge-site API', 'User not authorized for site', {
        siteKey,
        uid,
        owners: site.owners,
      });
      return new Response('Forbidden', { status: 403 });
    }

    // Trigger the site-wide cache purging workflow
    await handleSiteUpdate(siteKey, site);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Site-wide cache purge initiated',
        siteKey,
        homepage: site.homepage,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    logError('purge-site API', 'Failed to purge site cache', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
