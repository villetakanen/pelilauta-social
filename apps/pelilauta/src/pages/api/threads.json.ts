import crypto from 'node:crypto';
import type { APIContext } from 'astro';
import { Timestamp } from 'firebase-admin/firestore';
import { CHANNEL_DEFAULT_SLUG } from 'src/schemas/ChannelSchema';
import {
  parseThread,
  THREADS_COLLECTION_NAME,
  type Thread,
} from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { getAstroQueryParams } from 'src/utils/server/astroApiHelpers';
import { serverDB } from '../../firebase/server';

export async function GET({ request }: APIContext) {
  const publicThreads: Thread[] = [];

  const { startAt, channel, limit, uid, sort } = getAstroQueryParams(request);

  const orderBy = startAt
    ? 'flowTime'
    : sort === 'createdAt'
      ? 'createdAt'
      : 'flowTime';

  // Base query for all public threads
  const allPublicThreadsCollection = serverDB
    .collection(THREADS_COLLECTION_NAME)
    .where('public', '==', true)
    .orderBy(orderBy, 'desc');

  // If channel is provided, filter threads by channel
  const channelThreads = channel
    ? allPublicThreadsCollection.where('channel', '==', channel)
    : allPublicThreadsCollection;

  // Start time is a flowTime value, it needs to be converted into a firestore timestamp
  const startTimeTimestamp = startAt
    ? new Timestamp(Number(startAt) / 1000, 0)
    : null;

  // If startTime is provided, filter threads by startTime (pagination by flowTime to circumvent the firestore limitations)
  const currentPageStart = startAt
    ? channelThreads.where('flowTime', '<', startTimeTimestamp)
    : channelThreads;

  const uidFilter = uid
    ? currentPageStart.where('author', '==', uid)
    : currentPageStart;

  // We allow limit up to 11 threads
  const limitValue = limit ? Math.min(Number(limit), 11) : 11;

  // Get the threads
  const threads = await uidFilter.limit(limitValue).get();

  // Convert the threads to client format
  for (const threadDoc of threads.docs) {
    const data = threadDoc.data();
    // Some legacy threads have a topic instead of a channel,
    // so lets set the channel to the topic if it exists
    // and the channel is not set set a default channel,
    // as channel is expected by version 17 and beyond
    data.channel = data.channel ?? CHANNEL_DEFAULT_SLUG;

    publicThreads.push(parseThread(toClientEntry(data), threadDoc.id));
  }

  if (!publicThreads.length) {
    return new Response(JSON.stringify([]), {
      status: 404,
      statusText: 'No threads found',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1, stale-while-revalidate',
      },
    });
  }

  const body = JSON.stringify(publicThreads);
  const etag = crypto.createHash('sha1').update(body).digest('hex');

  const ifNoneMatch = request.headers.get('if-none-match');

  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      ETag: etag,
    },
  });
}
