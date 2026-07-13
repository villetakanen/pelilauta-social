import {
  PAGE_HISTORY_COLLECTION_NAME,
  PageHistorySchema,
} from 'src/schemas/PageHistorySchema';
import type { Page } from 'src/schemas/PageSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';

/**
 * Add a page revision to the history of a page using an efficient and safe
 * Firestore transaction. This prevents re-writing the entire history array on
 * every update.
 *
 * @param current current page state
 * @param incoming update to the page, typically from a form submission
 */
export async function addPageRevision(current: Page, incoming: Partial<Page>) {
  // Validate inputs
  if (!current?.key || !current?.siteKey) {
    logWarn('addPageRevision', 'Invalid current page data');
    return;
  }

  if (!incoming.markdownContent && incoming.markdownContent !== '') {
    logWarn('addPageRevision', 'No content change to track');
    return;
  }

  const currentUid = uid.get();
  if (!currentUid) {
    logWarn('addPageRevision', 'No authenticated user found');
    return;
  }

  try {
    const { db } = await import('..');
    // We need `runTransaction` for this pattern
    const { doc, runTransaction, serverTimestamp } = await import(
      'firebase/firestore'
    );
    const { createPatch } = await import('diff');

    const reversePatch = createPatch(
      current.name,
      incoming.markdownContent ?? '',
      current.markdownContent ?? '',
    );

    // Only proceed if there are actual changes
    if (!reversePatch.includes('@@')) {
      logDebug(
        'addPageRevision',
        'No content changes detected, skipping revision',
      );
      return;
    }

    const historyDocRef = doc(
      db,
      SITES_COLLECTION_NAME,
      current.siteKey,
      PAGE_HISTORY_COLLECTION_NAME,
      current.key,
    );

    const newRevision = {
      createdAt: Date.now(), // Using client time for simplicity here, serverTimestamp is also an option
      author: currentUid,
      change: reversePatch,
    };

    // runTransaction ensures the following operations are atomic (all or nothing)
    await runTransaction(db, async (transaction) => {
      const historyDoc = await transaction.get(historyDocRef);

      if (!historyDoc.exists()) {
        // If the history document doesn't exist, create it.
        transaction.set(historyDocRef, {
          key: current.key,
          history: [newRevision], // Start the history array with our new revision
          updatedAt: serverTimestamp(),
        });
      } else {
        // If it exists, get the current history array.
        const historyData = PageHistorySchema.parse(historyDoc.data());

        // Add the new revision
        const newHistory = [...historyData.history, newRevision];

        // Enforce the size limit
        const MAX_HISTORY_SIZE = 50;
        if (newHistory.length > MAX_HISTORY_SIZE) {
          // Slice from the end to keep the newest revisions
          newHistory.splice(0, newHistory.length - MAX_HISTORY_SIZE);
        }

        // Update the document with the newly formed array.
        // Because this is inside a transaction, Firestore handles conflicts.
        transaction.update(historyDocRef, {
          history: newHistory,
          updatedAt: serverTimestamp(),
        });
      }
    });

    logDebug('addPageRevision', `Added revision for page ${current.key}`);
  } catch (error) {
    logError(
      'addPageRevision',
      'Failed to add page revision in transaction:',
      error,
    );
    throw error;
  }
}
