import { serverDB } from '@firebase/server';
import type { Entry } from '@schemas/EntrySchema';
import {
  SITES_COLLECTION_NAME,
  type Site,
  SiteUpdateSchema,
} from '@schemas/SiteSchema';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { toFirestoreEntry } from '@utils/server/toFirestoreEntry';
import type { APIContext } from 'astro';
import { getSiteData } from '../../../../firebase/server/sites';

export async function GET({ params, request }: APIContext): Promise<Response> {
  const { siteKey } = params;
  if (!siteKey) {
    return new Response('Invalid request', { status: 400 });
  }

  const site = await getSiteData(siteKey);

  if (!site) {
    return new Response('Site not found', { status: 404 });
  }

  // Generate ETag based on site's updatedAt timestamp
  const etag = `"${site.updatedAt}"`;

  // Check if client has current version
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(JSON.stringify(site), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ETag: etag,
      'Cache-Control': 's-maxage=300, stale-while-revalidate=1800', // 5min cache
    },
  });
}

/**
 * Partially update an existing site
 * PATCH /api/sites/[siteKey]
 *
 * Note: We use PATCH as the primary method because we support partial updates.
 * Only the fields provided in the request body are updated; other fields remain unchanged.
 * This is semantically correct according to REST conventions.
 */
export async function PATCH({
  params,
  request,
}: APIContext): Promise<Response> {
  const endpointName = 'updateSite';
  const { siteKey } = params;

  if (!siteKey) {
    return new Response(JSON.stringify({ error: 'Site key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Authenticate user
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Parse request body
    const body = await request.json();

    logDebug(endpointName, 'Update request received', {
      siteKey,
      uid,
      fields: Object.keys(body),
    });

    // 3. Get existing site
    const siteRef = serverDB.collection(SITES_COLLECTION_NAME).doc(siteKey);
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingSite = siteDoc.data() as Site;

    // 4. Verify ownership
    if (!existingSite.owners?.includes(uid)) {
      logWarn(endpointName, 'Unauthorized update attempt', {
        siteKey,
        uid,
        owners: existingSite.owners,
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Not site owner' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Validate update data using SiteUpdateSchema
    const validatedUpdate = SiteUpdateSchema.parse(body);

    logDebug(endpointName, 'Update data validated', {
      siteKey,
      fields: Object.keys(validatedUpdate),
    });

    // 6. Update site document using server-side toFirestoreEntry
    // Silent mode prevents updating flowTime if body.silent is true
    await siteRef.update(
      toFirestoreEntry(validatedUpdate as Partial<Entry>, {
        silent: body.silent || false,
      }),
    );

    logDebug(endpointName, 'Site document updated', { siteKey });

    // 7. Return success immediately (background tasks run async)
    const response = new Response(
      JSON.stringify({
        success: true,
        siteKey,
        message: 'Site updated successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );

    // 8. Execute background tasks asynchronously (cache purging)
    executeUpdateBackgroundTasks(siteKey);

    return response;
  } catch (error) {
    logError(endpointName, 'Failed to update site:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

/**
 * Background tasks after site update
 */
function executeUpdateBackgroundTasks(siteKey: string): void {
  Promise.resolve().then(async () => {
    try {
      // Purge site cache using NetlifyCachePurger
      try {
        const { NetlifyCachePurger } = await import(
          '../../../../lib/server/netlify-cache'
        );
        const purger = new NetlifyCachePurger();

        if (purger.isConfigured()) {
          const cacheTags = [`site-${siteKey}`];
          await purger.purgeTags(cacheTags);

          logDebug('updateSite:background', 'Cache purged', {
            siteKey,
            tagCount: cacheTags.length,
          });
        }
      } catch (error) {
        // Cache purging is optional - log but don't fail
        logWarn(
          'updateSite:background',
          'Cache purging not available or failed:',
          error,
        );
      }
    } catch (error) {
      logError('updateSite:background', 'Background task failed:', error);
    }
  });
}

/**
 * PUT is supported as an alias for PATCH for compatibility.
 * Both methods perform partial updates (PATCH semantics).
 */
export const PUT = PATCH;
