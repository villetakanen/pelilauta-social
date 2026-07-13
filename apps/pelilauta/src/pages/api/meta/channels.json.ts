import crypto from 'node:crypto';
import { logError } from '@utils/logHelpers';
import type { APIContext } from 'astro';
import { ChannelSchema } from 'src/schemas/ChannelSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { ZodError, z } from 'zod';
import { serverDB } from '../../../firebase/server';

export async function GET({ request }: APIContext): Promise<Response> {
  try {
    const channelsRef = serverDB.collection('meta').doc('threads');
    const doc = await channelsRef.get();

    const channelsData = doc.data()?.topics;

    if (!Array.isArray(channelsData)) {
      logError(
        'api/meta/channels',
        'Firestore document meta/threads does not contain a topics array.',
      );
      return new Response(
        JSON.stringify({ error: 'Channels data is missing or not an array' }),
        { status: 500 },
      );
    }

    const ChannelsArraySchema = z.array(ChannelSchema);
    const clientEntries = channelsData.map(toClientEntry);

    // Apply defaults for missing fields before parsing
    const channelsWithDefaults = clientEntries.map((channel: unknown) => ({
      ...(channel as Record<string, unknown>),
      icon: (channel as Record<string, unknown>).icon || 'discussion',
      description: (channel as Record<string, unknown>).description || '',
      threadCount: (channel as Record<string, unknown>).threadCount || 0,
      category: (channel as Record<string, unknown>).category || 'Pelilauta',
      flowTime: (channel as Record<string, unknown>).flowTime || 0,
    }));

    const channels = ChannelsArraySchema.parse(channelsWithDefaults);

    const body = JSON.stringify(channels);
    const etag = crypto.createHash('sha1').update(body).digest('hex');

    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour on the CDN, serve stale content while revalidating
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        ETag: etag,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logError(
        'api/meta/channels',
        'Failed to parse channels array:',
        error.issues,
      );
    } else {
      logError(
        'api/meta/channels',
        'Failed to fetch channels from Firestore:',
        error,
      );
    }
    return new Response(
      JSON.stringify({ error: 'Could not fetch or parse channels' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
