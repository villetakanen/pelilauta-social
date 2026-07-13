import crypto from 'node:crypto';
import type { APIContext } from 'astro';
import {
  migrateLegacySiteFields,
  type Site,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError } from 'src/utils/logHelpers';
import { getAstroQueryParams } from 'src/utils/server/astroApiHelpers';

export async function GET({ request }: APIContext) {
  const publicSites: Site[] = [];

  const searchParams = getAstroQueryParams(request);

  try {
    const { serverDB } = await import('../../../firebase/server');

    const queryWithLimit = searchParams.limit
      ? serverDB
          .collection('sites')
          .where('hidden', '==', false)
          .limit(Number.parseInt(searchParams.limit, 10))
          .orderBy('flowTime', 'desc')
      : serverDB.collection('sites').where('hidden', '==', false);

    const sitesCollection = searchParams.uid
      ? queryWithLimit.where('owners', 'array-contains', searchParams.uid)
      : queryWithLimit;

    const siteDocs = await sitesCollection.get();

    for (const siteDoc of siteDocs.docs) {
      publicSites.push(
        SiteSchema.parse(
          migrateLegacySiteFields({
            ...toClientEntry(siteDoc.data()),
            key: siteDoc.id,
          }),
        ),
      );
    }

    publicSites.sort((a, b) => {
      return b.flowTime - a.flowTime;
    });

    const body = JSON.stringify(publicSites);
    const etag = crypto.createHash('sha1').update(body).digest('hex');

    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=180, stale-while-revalidate=600',
        ETag: etag,
      },
    });
  } catch (e: unknown) {
    logError(e);
    return new Response(
      `Error fetching sites: ${e instanceof Error ? e.message : String(e)}`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
