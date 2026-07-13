// DEPRECATED: Use updateThreadApi() instead
// This function is kept temporarily for backward compatibility
// TODO: Remove after all usages are migrated to updateThreadApi

import { logWarn } from '@utils/logHelpers';
import { THREADS_COLLECTION_NAME, type Thread } from 'src/schemas/ThreadSchema';

/**
 * @deprecated Use updateThreadApi() instead for proper server-side validation,
 * tag indexing, and cache purging
 */
export async function updateThread(data: Partial<Thread>, silent = false) {
  logWarn(
    'updateThread',
    'DEPRECATED: This function is deprecated. Use updateThreadApi() instead.',
    { threadKey: data.key },
  );

  if (!data.key) {
    throw new Error('Thread key is required to update thread');
  }

  const { doc, getFirestore, updateDoc, serverTimestamp } = await import(
    'firebase/firestore'
  );

  const threadRef = doc(getFirestore(), THREADS_COLLECTION_NAME, data.key);

  if (silent) {
    // Silent update - only update the provided fields without touching timestamps
    await updateDoc(threadRef, data);
  } else {
    // Normal update - include timestamp updates
    await updateDoc(threadRef, {
      ...data,
      flowTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
