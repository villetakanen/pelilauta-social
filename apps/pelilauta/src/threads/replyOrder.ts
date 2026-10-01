import type { Reply } from 'src/schemas/ReplySchema';
import { toDate } from 'src/utils/schemaHelpers';

/**
 * The one ordering of a thread's replies, applied by the server read
 * (`src/firebase/server/discussion/fetchDiscussion.ts`) and by the live read
 * (`src/threads/client/DiscussionSection.svelte`) alike, so the two agree.
 *
 * specs/pelilauta/threads/replies/spec.md states it: replies sort by creation
 * time ascending, and reply keys break ties in ascending lexical order. A
 * reply carries a creation time, because `ReplySchema` rejects a record
 * without one, so no substitute for it is ordered here.
 */
export function compareReplies(a: Reply, b: Reply): number {
  const aTime = toDate(a.createdAt).getTime();
  const bTime = toDate(b.createdAt).getTime();

  if (aTime !== bTime) return aTime - bTime;
  if (a.key === b.key) return 0;

  return a.key < b.key ? -1 : 1;
}
