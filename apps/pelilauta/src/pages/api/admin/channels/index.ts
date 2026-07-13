import { serverDB } from '@firebase/server';
import { isAdmin } from '@firebase/server/admin';
import { type Channel, ChannelSchema } from '@schemas/ChannelSchema';
import { THREADS_COLLECTION_NAME } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { toMekanismiURI } from '@utils/mekanismiUtils';
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
 * Create a new channel
 * POST /api/admin/channels
 */
export async function POST({ request }: APIContext): Promise<Response> {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult; // Return error response
    }
    const adminUid = authResult;

    // Parse and validate request body
    const body = await request.json();
    const { name, category, icon, description = '' } = body;

    if (!name || !category) {
      return new Response('Bad Request - Name and category are required', {
        status: 400,
      });
    }

    // Generate slug and validate
    const slug = toMekanismiURI(name);
    if (!slug) {
      return new Response('Bad Request - Invalid channel name', {
        status: 400,
      });
    }

    // Create channel object
    const newChannel = {
      name,
      slug,
      category,
      icon: icon || 'discussion',
      description,
      threadCount: 0,
      flowTime: Date.now(),
    };

    // Validate using schema
    const validatedChannel = ChannelSchema.parse(newChannel);

    // Get existing channels and check for duplicates
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    let existingChannels = [];
    if (metaDoc.exists) {
      const data = metaDoc.data();
      existingChannels = data?.topics || [];

      // Check for duplicate slug
      const duplicate = existingChannels.find(
        (ch: Channel) => ch.slug === slug,
      );
      if (duplicate) {
        return new Response(
          'Conflict - Channel with this name already exists',
          { status: 409 },
        );
      }
    }

    // Add new channel to topics array
    const updatedChannels = [...existingChannels, validatedChannel];

    // Update the meta document
    await metaRef.set({ topics: updatedChannels }, { merge: true });

    logDebug(
      'ChannelsAPI',
      `Channel created by admin ${adminUid}:`,
      validatedChannel,
    );

    return new Response(JSON.stringify(validatedChannel), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logError('ChannelsAPI', 'Failed to create channel:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Update an existing channel
 * PUT /api/admin/channels
 */
export async function PUT({ request }: APIContext): Promise<Response> {
  try {
    // Authenticate admin
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult;
    }
    const uid = authResult;

    // Parse request body
    const body = await request.json();
    const { originalSlug, name, category, icon, description = '' } = body;

    if (!originalSlug || !name || !category) {
      return new Response(
        JSON.stringify({
          error: 'Original slug, name and category are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Generate new slug from updated name
    const newSlug = toMekanismiURI(name);
    if (!newSlug) {
      return new Response(JSON.stringify({ error: 'Invalid channel name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current channels
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    if (!metaDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Channels data not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const data = metaDoc.data();
    const existingChannels = data?.topics || [];

    // Find the channel to update
    const channelIndex = existingChannels.findIndex(
      (ch: Channel) => ch.slug === originalSlug,
    );
    if (channelIndex === -1) {
      return new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If slug is changing, check for conflicts
    if (originalSlug !== newSlug) {
      const duplicate = existingChannels.find(
        (ch: Channel) => ch.slug === newSlug,
      );
      if (duplicate) {
        return new Response(
          JSON.stringify({ error: 'Channel with new name already exists' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Update all threads that reference the old channel slug
      const threadsQuery = await serverDB
        .collection(THREADS_COLLECTION_NAME)
        .where('channel', '==', originalSlug)
        .get();

      if (!threadsQuery.empty) {
        const batch = serverDB.batch();
        threadsQuery.docs.forEach((doc) => {
          batch.update(doc.ref, { channel: newSlug });
        });
        await batch.commit();
      }
    }

    // Update the channel
    const updatedChannel = {
      ...existingChannels[channelIndex],
      name,
      slug: newSlug,
      category,
      icon: icon || 'discussion',
      description,
    };

    // Validate using schema
    const validatedChannel = ChannelSchema.parse(updatedChannel);

    // Update channels array
    const updatedChannels = [...existingChannels];
    updatedChannels[channelIndex] = validatedChannel;

    // Save to database
    await metaRef.set({ topics: updatedChannels }, { merge: true });

    logDebug(
      'AdminChannelsAPI',
      `Updated channel from ${originalSlug} to ${newSlug}`,
      { uid },
    );

    return new Response(
      JSON.stringify({ success: true, channel: validatedChannel }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    logError('AdminChannelsAPI', 'Error updating channel:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Delete a channel
 * DELETE /api/admin/channels?slug=channelSlug
 */
export async function DELETE({ request }: APIContext): Promise<Response> {
  try {
    // Authenticate admin
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult;
    }
    const uid = authResult;

    // Get slug from URL params
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug parameter required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Get current channels
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    if (!metaDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Channels data not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const data = metaDoc.data();
    const existingChannels = data?.topics || [];

    // Find the channel to delete
    const channelIndex = existingChannels.findIndex(
      (ch: Channel) => ch.slug === slug,
    );
    if (channelIndex === -1) {
      return new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if channel has threads
    const threadsQuery = await serverDB
      .collection(THREADS_COLLECTION_NAME)
      .where('channel', '==', slug)
      .limit(1)
      .get();

    if (!threadsQuery.empty) {
      return new Response(
        JSON.stringify({
          error:
            'Cannot delete channel with existing threads. Move or delete threads first.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Remove channel from array
    const updatedChannels = existingChannels.filter(
      (ch: Channel) => ch.slug !== slug,
    );

    // Save to database
    await metaRef.set({ topics: updatedChannels }, { merge: true });

    logDebug('AdminChannelsAPI', `Deleted channel ${slug}`, { uid });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('AdminChannelsAPI', 'Error deleting channel:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Get all channels (for admin interface)
 * GET /api/admin/channels
 */
export async function GET({ request }: APIContext): Promise<Response> {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult; // Return error response
    }

    // Get channels from meta document
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    let channels = [];
    if (metaDoc.exists) {
      const data = metaDoc.data();
      channels = data?.topics || [];
    }

    return new Response(JSON.stringify({ channels }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logError('ChannelsAPI', 'Failed to get channels:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
