import {
  parseReply,
  REPLIES_COLLECTION,
  type Reply,
} from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME } from 'src/schemas/ThreadSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { logError } from 'src/utils/logHelpers';
import { serverDB } from '..';

/**
 * Server side function to fetch a discussion related to a thread
 *
 * @param threadKey
 */
export async function fetchDiscussion(threadKey: string): Promise<Reply[]> {
  if (!threadKey) {
    return [];
  }
  const replies = serverDB
    .collection(THREADS_COLLECTION_NAME)
    .doc(threadKey)
    .collection(REPLIES_COLLECTION)
    .orderBy('createdAt', 'asc');

  const snapshot = await replies.get();

  const discussion: Reply[] = [];

  // Records are parsed one at a time, so a malformed record does not discard the valid ones.
  for (const doc of snapshot.docs) {
    try {
      discussion.push(
        parseReply(toClientEntry(fixImageData(doc.data())), doc.id, threadKey),
      );
    } catch (e) {
      logError('fetchDiscussion: skipped reply', doc.id, e);
    }
  }

  return discussion;
}
