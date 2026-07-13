import {
  type Channel,
  ChannelSchema,
  type ChannelWithStats,
} from 'src/schemas/ChannelSchema';
import {
  parseThread,
  THREADS_COLLECTION_NAME,
  type Thread,
} from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { serverDB } from '../../firebase/server';

/**
 * Fetches all channels from Firestore
 */
export async function getChannelsFromFirestore(): Promise<Channel[]> {
  try {
    const channelsRef = serverDB.collection('meta').doc('threads');
    const doc = await channelsRef.get();

    const channelsData = doc.data()?.topics;

    if (!Array.isArray(channelsData)) {
      logError(
        'getChannelsFromFirestore',
        'Firestore document meta/threads does not contain a topics array.',
      );
      return [];
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

    return ChannelsArraySchema.parse(channelsWithDefaults);
  } catch (error) {
    logError('getChannelsFromFirestore', 'Failed to fetch channels:', error);
    return [];
  }
}

/**
 * Fetches the latest thread for a specific channel based on sort order
 */
export async function getLatestThreadForChannel(
  channelSlug: string,
  sortBy: 'createdAt' | 'flowTime',
): Promise<Thread | null> {
  try {
    const snapshot = await serverDB
      .collection(THREADS_COLLECTION_NAME)
      .where('public', '==', true)
      .where('channel', '==', channelSlug)
      .orderBy(sortBy, 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Ensure backwards compatibility with legacy threads
    data.channel = data.channel ?? channelSlug;

    return parseThread(toClientEntry(data), doc.id);
  } catch (error) {
    logError(
      'getLatestThreadForChannel',
      `Failed to fetch latest thread for ${channelSlug}:`,
      error,
    );
    return null;
  }
}

/**
 * Fetches all channels with their latest thread statistics
 */
export async function getChannelsWithStats(): Promise<ChannelWithStats[]> {
  try {
    // 1. Fetch all channels metadata
    const channels = await getChannelsFromFirestore();

    if (!channels.length) {
      logError('getChannelsWithStats', 'No channels found');
      return [];
    }

    // 2. Batch fetch latest threads for all channels in parallel
    const channelStatsPromises = channels.map(async (channel) => {
      try {
        const [latestThread, latestUpdatedThread] = await Promise.all([
          getLatestThreadForChannel(channel.slug, 'createdAt'),
          getLatestThreadForChannel(channel.slug, 'flowTime'),
        ]);

        return {
          ...channel,
          stats: {
            latestThread,
            latestUpdatedThread:
              latestUpdatedThread?.key !== latestThread?.key
                ? latestUpdatedThread
                : null,
          },
        };
      } catch (error) {
        logError(
          'getChannelsWithStats',
          `Failed to fetch stats for channel ${channel.slug}:`,
          error,
        );
        // Return channel with empty stats on error
        return {
          ...channel,
          stats: {
            latestThread: null,
            latestUpdatedThread: null,
          },
        };
      }
    });

    // 3. Execute all channel stats queries in parallel
    const channelsWithStats = await Promise.all(channelStatsPromises);

    return channelsWithStats;
  } catch (error) {
    logError(
      'getChannelsWithStats',
      'Failed to fetch channels with stats:',
      error,
    );
    return [];
  }
}
