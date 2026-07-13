import { serverDB } from '@firebase/server';
import { isAdmin } from '@firebase/server/admin';
import { TopicsSchema } from '@schemas/TopicSchema';
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
 * Create a new topic
 * POST /api/admin/topics
 */
export async function POST({ request }: APIContext): Promise<Response> {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult; // Return error response
    }

    // Parse and validate request body
    const body = await request.json();
    const { name } = body;
    logDebug('TopicsAPI', 'Creating topic with name:', body);

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response('Bad Request - Topic name is required', {
        status: 400,
      });
    }

    const topicName = name.trim();

    // Get existing topics from meta document
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    let existingTopics: string[] = [];
    if (metaDoc.exists) {
      const data = metaDoc.data();
      existingTopics = data?.topicsArray || [];

      // Check for duplicate topic
      if (existingTopics.includes(topicName)) {
        return new Response('Conflict - Topic with this name already exists', {
          status: 409,
        });
      }
    }

    // Add new topic to the list
    const updatedTopics = [...existingTopics, topicName];

    // Validate using schema
    const validatedTopics = TopicsSchema.parse(updatedTopics);

    // Update the meta document
    await metaRef.set({ topicsArray: validatedTopics }, { merge: true });

    return new Response(JSON.stringify({ topic: topicName }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logError('TopicsAPI', 'Failed to create topic:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Update topic order
 * PUT /api/admin/topics
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
    const { topics } = body;

    if (!Array.isArray(topics)) {
      return new Response(
        JSON.stringify({ error: 'Topics array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Validate using schema
    const validatedTopics = TopicsSchema.parse(topics);

    // Update the meta document
    const metaRef = serverDB.collection('meta').doc('threads');
    await metaRef.set({ topicsArray: validatedTopics }, { merge: true });

    logDebug('TopicsAPI', `Updated topic order`, { uid, topics });

    return new Response(
      JSON.stringify({ success: true, topics: validatedTopics }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    logError('TopicsAPI', 'Error updating topics:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Delete a topic
 * DELETE /api/admin/topics?name=topicName
 */
export async function DELETE({ request }: APIContext): Promise<Response> {
  try {
    // Authenticate admin
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult;
    }
    const uid = authResult;

    // Get topic name from URL params
    const url = new URL(request.url);
    const topicName = url.searchParams.get('name');

    if (!topicName) {
      return new Response(
        JSON.stringify({ error: 'Topic name parameter required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Get current topics and channels
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    if (!metaDoc.exists) {
      return new Response(JSON.stringify({ error: 'Topics data not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = metaDoc.data();
    const existingTopics = data?.topicsArray || [];

    // Check if topic exists
    if (!existingTopics.includes(topicName)) {
      return new Response(JSON.stringify({ error: 'Topic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Remove topic from array
    const updatedTopics = existingTopics.filter((t: string) => t !== topicName);

    // Save to database
    await metaRef.set({ topicsArray: updatedTopics }, { merge: true });

    logDebug('TopicsAPI', `Deleted topic ${topicName}`, { uid });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('TopicsAPI', 'Error deleting topic:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Get all topics (for admin interface)
 * GET /api/admin/topics
 */
export async function GET({ request }: APIContext): Promise<Response> {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (typeof authResult !== 'string') {
      return authResult; // Return error response
    }

    // Get topics from meta document
    const metaRef = serverDB.collection('meta').doc('threads');
    const metaDoc = await metaRef.get();

    let topics: string[] = [];
    if (metaDoc.exists) {
      const data = metaDoc.data();
      topics = data?.topicList || [];
    }

    return new Response(JSON.stringify({ topics }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logError('TopicsAPI', 'Failed to get topics:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
