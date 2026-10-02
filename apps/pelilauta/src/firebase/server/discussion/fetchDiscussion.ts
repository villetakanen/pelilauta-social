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
 * `DiscussionRead` carries the replies and read status for a thread discussion.
 *
 * `incomplete` is `true` when one or more stored records failed schema
 * validation. `unavailable` is `true` when the Firestore collection read
 * failed.
 */
export interface DiscussionRead {
  replies: Reply[];
  incomplete: boolean;
  unavailable: boolean;
}

/**
 * `fetchDiscussion` fetches and validates discussion replies for a thread from
 * Firestore.
 *
 * Each record parses in isolation. Skipping malformed records sets
 * `incomplete` to `true` while preserving valid replies. A query failure sets
 * `unavailable` to `true` without throwing, allowing the caller to render
 * the opening post.
 *
 * @param threadKey Thread identifier.
 */
export async function fetchDiscussion(
  threadKey: string,
): Promise<DiscussionRead> {
  if (!threadKey) {
    return { replies: [], incomplete: false, unavailable: false };
  }
  // A reply stored without a creation time leaves the discussion here.
  const replies = serverDB
    .collection(THREADS_COLLECTION_NAME)
    .doc(threadKey)
    .collection(REPLIES_COLLECTION)
    .orderBy('createdAt', 'asc');

  let snapshot: FirebaseFirestore.QuerySnapshot;
  try {
    snapshot = await replies.get();
  } catch (error) {
    logError('fetchDiscussion', 'Reply read failed', threadKey, error);
    return { replies: [], incomplete: false, unavailable: true };
  }

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

  return { replies: discussion, incomplete, unavailable: false };
}
