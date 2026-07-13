import type { APIContext } from 'astro';
import { CHANNEL_DEFAULT_SLUG } from 'src/schemas/ChannelSchema';
import { parseThread, THREADS_COLLECTION_NAME } from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { serverDB } from '../../../firebase/server';

export async function GET({ params }: APIContext): Promise<Response> {
  const { threadKey } = params;

  if (!threadKey) {
    return new Response('Invalid request', { status: 400 });
  }

  const threadDoc = await serverDB
    .collection(THREADS_COLLECTION_NAME)
    .doc(threadKey)
    .get();

  const data = threadDoc.data();

  if (!data) {
    return new Response('Thread not found', { status: 404 });
  }

  // Some legacy threads have a topic instead of a channel,
  // so lets set the channel to the topic if it exists
  // and the channel is not set set a default channel,
  // as channel is expected by version 17 and beyond
  if (!data.channel) {
    data.channel = data.topic ?? CHANNEL_DEFAULT_SLUG;
  }

  if (!threadDoc.exists || !data) {
    return new Response('Thread not found', { status: 404 });
  }

  try {
    const data = threadDoc.data() || {};

    const fixedImages = fixImageData(data);

    const thread = parseThread(toClientEntry(fixedImages), threadKey);

    return new Response(JSON.stringify(thread), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    });
  } catch (_err: unknown) {
    return new Response('Invalid thread data', { status: 500 });
  }
}
