import { serverDB } from '@firebase/server';
import { isAdmin } from '@firebase/server/admin';
import { TAG_FIRESTORE_COLLECTION } from '@schemas/TagSchema';
import {
  THREADS_COLLECTION_NAME,
  type Thread,
  ThreadSchema,
} from '@schemas/ThreadSchema';
import { logDebug, logError, logWarn } from '@utils/logHelpers';
import { getValidFlowTime } from '@utils/schemaHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { getAllThreadTags, normalizeTag } from '@utils/shared/threadTagHelpers';
import { toTagData } from '@utils/shared/toTagData';
import type { APIContext } from 'astro';

/**
 * Add labels to a thread (admin only)
 * POST /api/threads/[threadKey]/labels
 *
 * Request body: { labels: string[] }
 * Response: { success: boolean, labels: string[], message?: string }
 */
export async function POST({ params, request }: APIContext): Promise<Response> {
  const endpointName = 'addThreadLabels';
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

  // 2. Verify admin status
  const userIsAdmin = await isAdmin(uid);
  if (!userIsAdmin) {
    logWarn(endpointName, 'Non-admin attempted to add labels', {
      threadKey,
      uid,
    });
    return new Response(
      JSON.stringify({ error: 'Forbidden: Admin access required' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    // 3. Parse request body
    const body = await request.json();
    const labelsToAdd = body.labels;

    if (!Array.isArray(labelsToAdd) || labelsToAdd.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: labels array required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    logDebug(endpointName, 'Add labels request received', {
      threadKey,
      uid,
      labelsToAdd,
    });

    // 4. Normalize labels
    const normalizedLabels = labelsToAdd.map(normalizeTag).filter(Boolean);

    if (normalizedLabels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid labels provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Get existing thread
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

    const existingThread = ThreadSchema.parse(threadDoc.data());

    // 6. Merge and deduplicate labels
    const existingLabels = (existingThread.labels || []).map(normalizeTag);
    const updatedLabels = [
      ...new Set([...existingLabels, ...normalizedLabels]),
    ];

    // 7. Update thread document
    await threadRef.update({
      labels: updatedLabels,
    });

    logDebug(endpointName, 'Thread labels updated', {
      threadKey,
      before: existingLabels.length,
      after: updatedLabels.length,
    });

    // 8. Get updated thread for tag index
    const updatedDoc = await threadRef.get();
    const updatedThread = {
      key: threadKey,
      ...updatedDoc.data(),
    } as Thread;

    // 9. Update tag index synchronously to prevent race conditions
    await updateTagIndexForThread(threadKey, updatedThread);

    // 10. Execute cache purging asynchronously (fire-and-forget)
    purgeThreadCaches(threadKey, updatedThread);

    // 11. Return success
    return new Response(
      JSON.stringify({
        success: true,
        labels: updatedLabels,
        message: 'Labels added successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );
  } catch (error) {
    logError(endpointName, 'Failed to add labels:', error);
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
 * Remove labels from a thread (admin only)
 * DELETE /api/threads/[threadKey]/labels
 *
 * Request body: { labels: string[] }
 * Response: { success: boolean, labels: string[], message?: string }
 */
export async function DELETE({
  params,
  request,
}: APIContext): Promise<Response> {
  const endpointName = 'removeThreadLabels';
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

  // 2. Verify admin status
  const userIsAdmin = await isAdmin(uid);
  if (!userIsAdmin) {
    logWarn(endpointName, 'Non-admin attempted to remove labels', {
      threadKey,
      uid,
    });
    return new Response(
      JSON.stringify({ error: 'Forbidden: Admin access required' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    // 3. Parse request body
    const body = await request.json();
    const labelsToRemove = body.labels;

    if (!Array.isArray(labelsToRemove) || labelsToRemove.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: labels array required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    logDebug(endpointName, 'Remove labels request received', {
      threadKey,
      uid,
      labelsToRemove,
    });

    // 4. Normalize labels
    const normalizedLabelsToRemove = labelsToRemove
      .map(normalizeTag)
      .filter(Boolean);

    if (normalizedLabelsToRemove.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid labels provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 5. Get existing thread
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

    const existingThread = ThreadSchema.parse(threadDoc.data());

    // 6. Filter out labels to remove
    const existingLabels = (existingThread.labels || []).map(normalizeTag);
    const updatedLabels = existingLabels.filter(
      (label) => !normalizedLabelsToRemove.includes(label),
    );

    // 7. Update thread document
    await threadRef.update({
      labels: updatedLabels,
    });

    logDebug(endpointName, 'Thread labels updated', {
      threadKey,
      before: existingLabels.length,
      after: updatedLabels.length,
    });

    // 8. Get updated thread for tag index
    const updatedDoc = await threadRef.get();
    const updatedThread = {
      key: threadKey,
      ...updatedDoc.data(),
    } as Thread;

    // 9. Update tag index synchronously to prevent race conditions
    await updateTagIndexForThread(threadKey, updatedThread);

    // 10. Execute cache purging asynchronously (fire-and-forget)
    purgeThreadCaches(threadKey, updatedThread);

    // 11. Return success
    return new Response(
      JSON.stringify({
        success: true,
        labels: updatedLabels,
        message: 'Labels removed successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );
  } catch (error) {
    logError(endpointName, 'Failed to remove labels:', error);
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
 * Updates the tag index for a thread (synchronous to prevent race conditions).
 * Combines user tags and admin labels into the tag index.
 */
async function updateTagIndexForThread(
  threadKey: string,
  updatedThread: Thread,
): Promise<void> {
  try {
    const allTags = getAllThreadTags(updatedThread);

    if (allTags.length > 0) {
      const tagData = toTagData(
        { ...updatedThread, tags: allTags },
        threadKey,
        'thread',
        getValidFlowTime(updatedThread),
      );

      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .set(tagData);

      logDebug('updateTagIndex', 'Tag index updated', {
        threadKey,
        tagCount: allTags.length,
      });
    } else {
      // Remove from tag index if no tags or labels
      await serverDB
        .collection(TAG_FIRESTORE_COLLECTION)
        .doc(threadKey)
        .delete();

      logDebug('updateTagIndex', 'Removed from tag index', {
        threadKey,
      });
    }
  } catch (error) {
    logError('updateTagIndex', 'Failed to update tag index:', error);
    throw error; // Re-throw to fail the API request if tag index update fails
  }
}

/**
 * Purges caches for thread and related tags (asynchronous, fire-and-forget).
 */
function purgeThreadCaches(threadKey: string, updatedThread: Thread): void {
  Promise.resolve().then(async () => {
    try {
      const { NetlifyCachePurger } = await import(
        '../../../../lib/server/netlify-cache'
      );
      const purger = new NetlifyCachePurger();

      if (purger.isConfigured()) {
        const allTags = getAllThreadTags(updatedThread);
        const cacheTags = [`thread-${threadKey}`];

        // Add cache tags for all thread tags
        if (allTags.length > 0) {
          cacheTags.push(...allTags.map((tag) => `tag-${tag.toLowerCase()}`));
        }

        await purger.purgeTags(cacheTags);

        logDebug('purgeThreadCaches', 'Cache purged', {
          threadKey,
          tagCount: cacheTags.length,
        });
      }
    } catch (error) {
      // Cache purging is optional - log but don't fail
      logWarn(
        'purgeThreadCaches',
        'Cache purging not available or failed:',
        error,
      );
    }
  });
}
