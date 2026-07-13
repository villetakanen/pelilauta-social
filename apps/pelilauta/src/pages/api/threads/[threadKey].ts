import { serverDB } from '@firebase/server';
import { isAdmin } from '@firebase/server/admin';
import {
  CHANNELS_META_REF,
  type Channel,
  ChannelSchema,
} from '@schemas/ChannelSchema';
import { TAG_FIRESTORE_COLLECTION } from '@schemas/TagSchema';
import {
  THREADS_COLLECTION_NAME,
  type Thread,
  ThreadSchema,
} from '@schemas/ThreadSchema';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { toDate } from '@utils/schemaHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { toFirestoreEntry } from '@utils/server/toFirestoreEntry';
import { getAllThreadTags } from '@utils/shared/threadTagHelpers';
import { toTagData } from '@utils/shared/toTagData';
import type { APIContext } from 'astro';

/**
 * Update an existing thread
 * PUT /api/threads/[threadKey]
 */
export async function PUT({ params, request }: APIContext): Promise<Response> {
  const endpointName = 'updateThread';
  const { threadKey } = params;

  if (!threadKey) {
    return new Response(JSON.stringify({ error: 'Thread key required' }), {
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
      threadKey,
      uid,
      fields: Object.keys(body),
    });

    // 3. Get existing thread
    const threadRef = serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingThread = threadDoc.data() as Thread;

    // 4. Verify ownership
    if (!existingThread.owners?.includes(uid)) {
      logWarn(endpointName, 'Unauthorized update attempt', {
        threadKey,
        uid,
        owners: existingThread.owners,
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Not thread owner' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Validate and prepare update data
    // Note: 'labels' is intentionally excluded - only admins can modify labels via /labels endpoint
    const allowedFields = [
      'title',
      'markdownContent',
      'channel',
      'tags',
      'youtubeId',
      'poster',
      'public',
    ];

    const updateData: Partial<Thread> & Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Parse tags if provided as JSON string
    if (typeof updateData.tags === 'string') {
      try {
        updateData.tags = JSON.parse(updateData.tags as string);
      } catch {
        logWarn(endpointName, 'Invalid tags JSON format');
      }
    }

    // 6. Update thread document using server-side toFirestoreEntry
    // Silent mode prevents updating flowTime if body.silent is true
    await threadRef.update(
      toFirestoreEntry(updateData, {
        silent: body.silent || false,
      }),
    );

    logDebug(endpointName, 'Thread document updated', { threadKey });

    // 7. Get updated thread for post-processing
    const updatedDoc = await threadRef.get();
    const updatedThread = {
      key: threadKey,
      ...updatedDoc.data(),
    } as Thread;

    // 8. Return success immediately (background tasks run async)
    const response = new Response(
      JSON.stringify({
        success: true,
        threadKey,
        message: 'Thread updated successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );

    // 9. Execute background tasks asynchronously
    executeUpdateBackgroundTasks(threadKey, updatedThread, existingThread);

    return response;
  } catch (error) {
    logError(endpointName, 'Failed to update thread:', error);
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
 * Background tasks after thread update
 */
function executeUpdateBackgroundTasks(
  threadKey: string,
  updatedThread: Thread,
  existingThread: Thread,
): void {
  Promise.resolve().then(async () => {
    try {
      // 8. Update tag index if tags or title changed
      // Use getAllThreadTags to combine user tags and admin labels for the index
      if (
        JSON.stringify(updatedThread.tags) !==
          JSON.stringify(existingThread.tags) ||
        updatedThread.title !== existingThread.title
      ) {
        const allTags = getAllThreadTags(updatedThread);

        if (allTags.length > 0) {
          const tagData = toTagData(
            { ...updatedThread, tags: allTags },
            threadKey,
            'thread',
            toDate(updatedThread.flowTime).getTime(),
          );

          await serverDB
            .collection(TAG_FIRESTORE_COLLECTION)
            .doc(threadKey)
            .set(tagData);

          logDebug('updateThread:background', 'Updated tag index', {
            threadKey,
            tagCount: allTags.length,
          });
        } else {
          // Remove from tag index if no tags or labels
          await serverDB
            .collection(TAG_FIRESTORE_COLLECTION)
            .doc(threadKey)
            .delete();

          logDebug('updateThread:background', 'Removed from tag index', {
            threadKey,
          });
        }
      }

      // Task 2: Purge thread cache (only if netlify-cache is available)
      try {
        const { NetlifyCachePurger } = await import(
          '../../../lib/server/netlify-cache'
        );
        const purger = new NetlifyCachePurger();

        if (purger.isConfigured()) {
          const cacheTags = [`thread-${threadKey}`];

          // Add tag cache tags if tags or labels changed
          // Use getAllThreadTags to include both user tags AND admin labels
          if (
            JSON.stringify(updatedThread.tags) !==
              JSON.stringify(existingThread.tags) ||
            JSON.stringify(updatedThread.labels) !==
              JSON.stringify(existingThread.labels)
          ) {
            const updatedAllTags = getAllThreadTags(updatedThread);
            const existingAllTags = getAllThreadTags(existingThread);
            const allTags = [...updatedAllTags, ...existingAllTags];
            const uniqueTags = [...new Set(allTags)];
            cacheTags.push(
              ...uniqueTags.map((tag) => `tag-${tag.toLowerCase()}`),
            );
          }

          await purger.purgeTags(cacheTags);

          logDebug('updateThread:background', 'Cache purged', {
            threadKey,
            tagCount: cacheTags.length,
          });
        }
      } catch (error) {
        // Cache purging is optional - log but don't fail
        logWarn(
          'updateThread:background',
          'Cache purging not available or failed:',
          error,
        );
      }
    } catch (error) {
      logError('updateThread:background', 'Background task failed:', error);
    }
  });
}

/**
 * PATCH is an alias for PUT (partial updates)
 */
export const PATCH = PUT;

export async function DELETE({ request, params }: APIContext) {
  const { threadKey } = params;
  const uid = await tokenToUid(request);

  if (!uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!threadKey) {
    return new Response('Bad Request: Missing threadKey', { status: 400 });
  }

  const threadRef = serverDB.collection(THREADS_COLLECTION_NAME).doc(threadKey);

  try {
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return new Response('Not Found', { status: 404 });
    }

    const thread = ThreadSchema.parse(threadDoc.data());

    const isOwner = thread.owners.includes(uid);
    const userIsAdmin = await isAdmin(uid);

    if (!isOwner && !userIsAdmin) {
      return new Response('Forbidden', { status: 403 });
    }

    // Critical task: Delete the thread document
    await threadRef.delete();

    // Respond immediately
    // Background task: Update channel thread count
    if (thread.channel) {
      const metaRef = serverDB.doc(CHANNELS_META_REF);
      metaRef
        .get()
        .then((doc) => {
          if (!doc.exists) return;
          const topics = doc.data()?.topics || [];
          const channels: Channel[] = topics.map((t: unknown) =>
            ChannelSchema.parse(t),
          );
          const channelIndex = channels.findIndex(
            (c: Channel) => c.slug === thread.channel,
          );
          if (channelIndex > -1) {
            channels[channelIndex].threadCount =
              (channels[channelIndex].threadCount || 1) - 1;
            metaRef.update({ topics: channels }).catch((err) => {
              logWarn(
                'deleteThread-background',
                `Failed to update topics in ${CHANNELS_META_REF}`,
                err,
              );
            });
          }
        })
        .catch((err) => {
          logWarn(
            'deleteThread-background',
            `Failed to get ${CHANNELS_META_REF}`,
            err,
          );
        });
    }

    return new Response(null, { status: 202 });
  } catch (error) {
    logError('deleteThread', 'Failed to delete thread:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
