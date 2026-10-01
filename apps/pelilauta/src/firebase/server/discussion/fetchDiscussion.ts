import {
  parseReply,
  REPLIES_COLLECTION,
  type Reply,
} from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME } from 'src/schemas/ThreadSchema';
import { compareReplies } from 'src/threads/replyOrder';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { logError } from 'src/utils/logHelpers';
import { serverDB } from '..';

/**
 * A discussion read, isolated from any single record's failure.
 *
 * `incomplete` is `true` when at least one stored reply failed
 * `ReplySchema` parsing; `replies` carries every record that parsed.
 */
export interface DiscussionRead {
  replies: Reply[];
  incomplete: boolean;
}

/**
 * Server side function to fetch a discussion related to a thread.
 *
 * Each stored record parses in isolation: a malformed reply is skipped and
 * marks the read `incomplete` rather than discarding every valid reply.
 *
 * @param threadKey
 */
export async function fetchDiscussion(
  threadKey: string,
): Promise<DiscussionRead> {
  if (!threadKey) {
    return { replies: [], incomplete: false };
  }
  const replies = serverDB
    .collection(THREADS_COLLECTION_NAME)
    .doc(threadKey)
    .collection(REPLIES_COLLECTION);

  const snapshot = await replies.get();

  const discussion: Reply[] = [];
  let incomplete = false;

  for (const doc of snapshot.docs) {
    try {
      const reply = parseReply(
        toClientEntry(fixImageData(doc.data())),
        doc.id,
        threadKey,
      );
      discussion.push(reply);
    } catch (error) {
      logError('fetchDiscussion', 'Skipping malformed reply', doc.id, error);
      incomplete = true;
    }
  }

  discussion.sort(compareReplies);

  return { replies: discussion, incomplete };
}
