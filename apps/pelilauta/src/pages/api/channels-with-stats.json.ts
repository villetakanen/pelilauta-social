import crypto from 'node:crypto';
import { logError } from '@utils/logHelpers';
import type { APIContext } from 'astro';
import { getChannelsWithStats } from 'src/utils/server/channels';

export async function GET({ request }: APIContext): Promise<Response> {
  try {
    // Fetch all channels with their statistics in one aggregated request
    const channelsWithStats = await getChannelsWithStats();

    if (!channelsWithStats.length) {
      return new Response(JSON.stringify([]), {
        status: 404,
        statusText: 'No channels found',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    const body = JSON.stringify(channelsWithStats);
    const etag = crypto.createHash('sha1').update(body).digest('hex');

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=120, stale-while-revalidate=300', // 2 min cache, 5 min stale
        ETag: etag,
      },
    });
  } catch (error) {
    logError(
      'api/channels-with-stats',
      'Failed to fetch channels with stats:',
      error,
    );
    return new Response(
      JSON.stringify({ error: 'Failed to fetch channels data' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
