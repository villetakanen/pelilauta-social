import type { APIContext } from 'astro';
import {
  TAG_FIRESTORE_COLLECTION,
  type Tag,
  TagSchema,
} from 'src/schemas/TagSchema';
import { getTagDisplayInfo, resolveTagSynonym } from 'src/schemas/TagSynonyms';
import { logDebug, logError } from 'src/utils/logHelpers';
import { serverDB } from '../../../firebase/server';

/* type Thread = {
  title: string;
  key: string;
  tags: string[];
  flowTime: number;
  author: string;
};

/**
 * Fetches 20 first of the threads from the firestore, that have the given tag
 *
 * @param tag [string] The tag to search for
 * @returns [Thread[]] An array of threads that have the given tag
 * /
async function fetchThreads(tag: string) {
  const docs = serverDB
    .collection(THREADS_COLLECTION_NAME)
    .where('tags', 'array-contains', tag)
    .orderBy('flowTime', 'desc')
    .limit(20);
  const threads = await docs.get();

  const threadData: Thread[] = [];

  for (const thread of threads.docs) {
    const data = thread.data();
    threadData.push({
      title: data.title as string,
      key: thread.id as string,
      tags: data.tags || [],
      flowTime: toDate(data.flowTime).getTime(),
      author: data.owners?.[0] as string,
    });
  }

  return threadData;
} */

export async function GET({ params }: APIContext): Promise<Response> {
  const { tag } = params;

  if (!tag) {
    return new Response('Tag required', { status: 400 });
  }

  // Resolve synonym to canonical tag
  const canonicalTag = resolveTagSynonym(tag);
  const tagInfo = getTagDisplayInfo(canonicalTag);

  // Fetch entries for canonical tag AND its synonyms
  // IMPORTANT: Decode URL encoding and lowercase all tags before querying
  // because toTagData() stores tags in lowercase without URL encoding
  const allTags = tagInfo
    ? [canonicalTag, ...tagInfo.synonyms].map((t) =>
        decodeURIComponent(t).toLowerCase(),
      )
    : [decodeURIComponent(canonicalTag).toLowerCase()];

  logDebug('tags-api', 'Fetching entries for tags', {
    tag,
    canonicalTag,
    allTags,
  });

  const response = {
    entries: [] as Tag[],
    canonical: canonicalTag,
    displayName: tagInfo?.displayName || canonicalTag,
    description: tagInfo?.description,
    synonymCount: tagInfo?.synonyms.length || 0,
  };

  try {
    // Query for all variations using array-contains-any
    const docs = await serverDB
      .collection(TAG_FIRESTORE_COLLECTION)
      .where('tags', 'array-contains-any', allTags)
      .orderBy('flowTime', 'desc')
      .limit(50)
      .get();

    for (const doc of docs.docs) {
      try {
        const data = doc.data();
        response.entries.push(TagSchema.parse(data));
      } catch (parseError) {
        logError(`Failed to parse tag entry ${doc.id}:`, parseError);
      }
    }
  } catch (firestoreError) {
    logError(
      `Firestore query error for tag "${canonicalTag}":`,
      firestoreError,
    );
    // Return empty results instead of crashing
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300', // Shorter cache on errors
      },
    });
  }

  if (response.entries.length === 0) {
    return new Response('No entries found', { status: 404 });
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=1800', // 5min cache, 30min stale
    },
  });
}
