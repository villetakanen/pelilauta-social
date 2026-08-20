import { atom } from 'nanostores';
import type { Reply } from 'src/schemas/ReplySchema';

/**
 * # Reply editing
 *
 * Which reply the reader is editing, if any.
 *
 * A reply stands in the document and the bar it is edited in stands in
 * application chrome, so the two are siblings, not parent and child, and
 * cannot pass this between them as a prop. The store is the one thing they
 * share: a reply's edit action writes it, and the thread's chat bar reads it.
 *
 * `null` is the resting state, and the state a finished or abandoned edit
 * returns to.
 */
export const editedReply = atom<Reply | null>(null);

/** Puts a reply in the bar, replacing whatever it was editing before. */
export function editReply(reply: Reply) {
  editedReply.set(reply);
}

/** Ends the edit, whether it was saved or abandoned. */
export function endEditing() {
  editedReply.set(null);
}
