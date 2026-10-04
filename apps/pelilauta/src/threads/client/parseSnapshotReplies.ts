import { type Reply, ReplySchema } from 'src/schemas/ReplySchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { fixImageData } from 'src/utils/fixImageData';
import { logError } from 'src/utils/logHelpers';

interface SnapshotDoc {
  id: string;
  data(): Record<string, unknown>;
}

/** Parses replies in snapshot order; a malformed reply is skipped and the rest render. */
export function parseSnapshotReplies(
  docs: SnapshotDoc[],
  threadKey: string,
): Reply[] {
  const replies: Reply[] = [];
  for (const doc of docs) {
    try {
      replies.push(
        ReplySchema.parse({
          ...toClientEntry(fixImageData(doc.data())),
          key: doc.id,
          threadKey,
        }),
      );
    } catch (e) {
      logError('DiscussionSection: skipped reply', doc.id, e);
    }
  }
  return replies;
}
