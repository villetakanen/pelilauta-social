// DEPRECATED: This function is obsolete
// Tag index updates are now handled automatically by the server-side API
// when using updateThreadApi() to update threads
// This file is kept for backward compatibility only

import { TAG_FIRESTORE_COLLECTION } from 'src/schemas/TagSchema';
import type { Thread } from 'src/schemas/ThreadSchema';
import { logError, logWarn } from 'src/utils/logHelpers';
import { toDate } from 'src/utils/schemaHelpers';
import { toTagData } from 'src/utils/shared/toTagData';

async function removeTags(key: string) {
  // remove the page tags entry from the tags collection
  const { getFirestore, deleteDoc, doc } = await import('firebase/firestore');
  try {
    await deleteDoc(doc(getFirestore(), TAG_FIRESTORE_COLLECTION, key));
  } catch (e) {
    logError('removeTags', e);
  }
}

async function setTags(thread: Partial<Thread>) {
  // set the page tags entry to the tags collection
  const { getFirestore, setDoc, doc } = await import('firebase/firestore');

  const tagData = toTagData(
    { ...thread, owners: thread.owners || [] },
    `${thread.key}`,
    'thread',
    toDate(thread.flowTime).getTime(),
  );

  try {
    await setDoc(
      doc(getFirestore(), TAG_FIRESTORE_COLLECTION, `${thread.key}`),
      tagData,
    );
  } catch (e) {
    logError('setTags', e);
  }
}

/**
 * @deprecated This function is obsolete. Tag index updates are now handled
 * automatically by the server-side API when using updateThreadApi().
 * This function is kept for backward compatibility only.
 */
export async function updateThreadTags(thread: Partial<Thread>) {
  logWarn(
    'updateThreadTags',
    'DEPRECATED: This function is obsolete. Tag updates are now handled by updateThreadApi().',
  );
  const tags = thread.tags;
  if (!thread.key) {
    logWarn('updateThreadTags', 'Thread key is required for a tags update');
  }
  if (!thread.owners) {
    logWarn('updateThreadTags', 'Thread owners are required for a tags update');
  }
  if (!tags) {
    await removeTags(`${thread.key}`);
  } else {
    await setTags(thread);
  }
}
