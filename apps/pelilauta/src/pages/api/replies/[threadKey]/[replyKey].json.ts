import { logError } from '@utils/logHelpers';
import type { APIContext } from 'astro';
import { parseReply, REPLIES_COLLECTION } from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME } from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { serverDB } from '../../../../firebase/server';

export async function GET({ params }: APIContext): Promise<Response> {
  const { threadKey, replyKey } = params;

  // Input validation
  if (!threadKey || !replyKey) {
    logError('ReplyAPI', 'Missing required parameters', {
      threadKey,
      replyKey,
    });
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const replyDoc = await serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey)
      .collection(REPLIES_COLLECTION)
      .doc(replyKey)
      .get();

    const data = replyDoc.data();

    if (!replyDoc.exists || !data) {
      return new Response('Reply not found', { status: 404 });
    }

    // Parse and validate reply data
    const reply = parseReply(toClientEntry(data), replyKey, threadKey);

    // Smart caching strategy based on content age
    const cacheHeaders = getCacheHeaders(data);

    return new Response(JSON.stringify(reply), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...cacheHeaders,
      },
    });
  } catch (error) {
    logError('ReplyAPI', 'Failed to fetch reply', error, {
      threadKey,
      replyKey,
    });

    // Don't expose internal errors to client
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * Interface for Firestore timestamp data used in caching decisions
 */
interface TimestampData {
  updatedAt?: { toMillis(): number };
  createdAt?: { toMillis(): number };
}

/**
 * Determines appropriate cache headers based on content age
 */
function getCacheHeaders(data: TimestampData): Record<string, string> {
  const now = Date.now();
  const updatedAt =
    data.updatedAt?.toMillis?.() || data.createdAt?.toMillis?.() || now;
  const age = Math.floor((now - updatedAt) / 1000); // seconds since last update

  // Fresh content (< 5 minutes): shorter cache
  if (age < 300) {
    return {
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
    };
  }

  // Recent content (< 1 hour): medium cache
  if (age < 3600) {
    return {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    };
  }

  // Older content: aggressive caching
  return {
    'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
    'Last-Modified': new Date(updatedAt).toUTCString(),
  };
}
