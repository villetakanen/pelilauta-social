import { REACTIONS_COLLECTION_NAME } from 'src/schemas/ReactionsSchema';
import { REPLIES_COLLECTION } from 'src/schemas/ReplySchema';
import { THREADS_COLLECTION_NAME } from 'src/schemas/ThreadSchema';

/**
 * Handles deleting a reply from a thread, and updates all necessary metadata.
 *
 * @param threadKey
 * @param replyKey
 */
export async function deleteReply(threadKey: string, replyKey: string) {
  const { getFirestore, deleteDoc, doc, updateDoc, increment } = await import(
    'firebase/firestore'
  );
  const db = getFirestore();

  // Delete the reply of the given thread, with the given key.
  await deleteDoc(
    doc(db, THREADS_COLLECTION_NAME, threadKey, REPLIES_COLLECTION, replyKey),
  );

  // Reduce reply count in the thread
  const threadRef = doc(db, THREADS_COLLECTION_NAME, threadKey);
  await updateDoc(threadRef, {
    replyCount: increment(-1),
  });

  // Remove the notifications entry for the reply
  await deleteDoc(doc(db, REACTIONS_COLLECTION_NAME, replyKey));
}
