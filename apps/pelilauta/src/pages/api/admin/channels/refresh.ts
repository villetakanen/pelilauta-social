import { serverDB } from '@firebase/server';
import { isAdmin } from '@firebase/server/admin';
import type { Channel } from '@schemas/ChannelSchema';
import { THREADS_COLLECTION_NAME } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import type { APIContext } from 'astro';

/**
 * Authentication middleware for admin endpoints
 */
async function verifyAdminAuth(request: Request): Promise<string | Response> {
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response('Unauthorized - Invalid token', { status: 401 });
  }

  const userIsAdmin = await isAdmin(uid);
  if (!userIsAdmin) {
    return new Response('Forbidden - Admin privileges required', {
      status: 403,
    });
  }

  return uid;
}

/**
 * Refresh statistics for all channels or a specific channel
 * POST /api/admin/channels/refresh
 */
export async function POST({ request }: APIContext): Promise<Response> {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult; // Return error response
    }
    const adminUid = authResult;

    // Parse request body for optional channel slug
    const body = await request.json().catch(() => ({}));
    const { channelSlug } = body;

    // Get current channels
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    if (!metaDoc.exists) {
      return new Response('Not Found - No channels data found', {
        status: 404,
      });
    }

    const data = metaDoc.data();
    const channels: Channel[] = data?.topics || [];

    if (channels.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No channels to refresh' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Filter to specific channel if provided
    const channelsToRefresh = channelSlug
      ? channels.filter((ch) => ch.slug === channelSlug)
      : channels;

    if (channelSlug && channelsToRefresh.length === 0) {
      return new Response('Not Found - Channel not found', { status: 404 });
    }

    logDebug(
      'RefreshAPI',
      `Refreshing ${channelsToRefresh.length} channels by admin ${adminUid}`,
    );

    // Refresh statistics for each channel
    const refreshPromises = channelsToRefresh.map(async (channel) => {
      try {
        // Query threads for this channel
        const threadsRef = serverDB.collection(THREADS_COLLECTION_NAME);
        const threadsQuery = threadsRef.where('channel', '==', channel.slug);
        const threadsSnapshot = await threadsQuery.get();

        // Calculate statistics
        const threadCount = threadsSnapshot.size;
        let latestFlowTime = 0;

        threadsSnapshot.docs.forEach((doc) => {
          const threadData = doc.data();
          if (threadData.flowTime) {
            const flowTime =
              typeof threadData.flowTime.toMillis === 'function'
                ? threadData.flowTime.toMillis()
                : threadData.flowTime;
            if (flowTime > latestFlowTime) {
              latestFlowTime = flowTime;
            }
          }
        });

        return {
          ...channel,
          threadCount,
          flowTime: latestFlowTime || Date.now(),
        };
      } catch (error) {
        logError(
          'RefreshAPI',
          `Failed to refresh channel ${channel.slug}:`,
          error,
        );
        // Return original channel data if refresh fails
        return channel;
      }
    });

    // Wait for all refreshes to complete
    const refreshedChannels = await Promise.all(refreshPromises);

    // Update the original channels array with refreshed data
    const updatedChannels = channels.map((originalChannel) => {
      const refreshed = refreshedChannels.find(
        (rc) => rc.slug === originalChannel.slug,
      );
      return refreshed || originalChannel;
    });

    // Update the meta document with refreshed statistics
    await metaRef.update({ topics: updatedChannels });

    const refreshedCount = channelSlug ? 1 : channels.length;
    logDebug(
      'RefreshAPI',
      `Successfully refreshed ${refreshedCount} channel(s)`,
    );

    return new Response(
      JSON.stringify({
        message: `Successfully refreshed ${refreshedCount} channel(s)`,
        refreshedChannels: channelSlug ? refreshedChannels : undefined,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    logError('RefreshAPI', 'Failed to refresh channel statistics:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
