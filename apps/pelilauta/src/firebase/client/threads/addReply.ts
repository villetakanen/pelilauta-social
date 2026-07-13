import { NotificationRequestSchema } from 'src/schemas/NotificationSchema';
import {
  REACTIONS_COLLECTION_NAME,
  type Reactions,
} from 'src/schemas/ReactionsSchema';
import { REPLIES_COLLECTION, type Reply } from 'src/schemas/ReplySchema';
import {
  type ImageArray,
  THREADS_COLLECTION_NAME,
  type Thread,
} from 'src/schemas/ThreadSchema';
import { logWarn } from 'src/utils/logHelpers';
import { createPlainSnippet } from 'src/utils/snippetHelpers';
import { authedPost } from '../apiClient';
import { addAssetToThread } from './addAssetToThread';

/**
 * Adds a reply to a thread with complete workflow including file uploads, reactions setup, and notifications
 *
 * This function performs the following operations:
 * 1. Creates a new reply document in the thread's replies subcollection
 * 2. Uploads any attached files to Firebase Storage and links them to the reply
 * 3. Updates the parent thread's reply count and flow time
 * 4. Initializes reaction data for the new reply (with author as sole subscriber)
 * 5. Sends notification to thread owner (if different from reply author)
 *
 * @param thread - The thread to add the reply to
 * @param author - The author's UID who is creating the reply
 * @param markdownContent - The reply content in markdown format
 * @param quoteref - Optional reference to quoted message/reply key
 * @param files - Optional array of files to upload and attach to the reply
 * @returns Promise that resolves when reply is successfully added (notifications are fire-and-forget)
 * @throws Error if reply creation, file upload, or thread update fails
 */
export async function addReply(
  thread: Thread,
  author: string,
  markdownContent: string,
  quoteref?: string,
  files: File[] = [],
): Promise<void> {
  const { db } = await import('..');
  const {
    serverTimestamp,
    addDoc,
    collection,
    increment,
    doc,
    updateDoc,
    setDoc,
  } = await import('firebase/firestore');
  const { toFirestoreEntry } = await import(
    'src/utils/client/toFirestoreEntry'
  );

  /**
   * Step 1: Create the reply document data structure
   */
  // Add a new reply to the thread
  const replyData: Partial<Reply> = {
    threadKey: thread.key,
    markdownContent, // Fixed typo
    owners: [author],
  };
  if (quoteref) replyData.quoteref = quoteref;

  /**
   * Step 2: Handle file uploads if any files are attached
   */
  if (files.length > 0) {
    const uploadedImages: ImageArray = [];
    for (const file of files) {
      const { downloadURL: url } = await addAssetToThread(thread.key, file);
      const alt = file.name;
      uploadedImages.push({ url, alt });
    }
    replyData.images = uploadedImages;
  }

  /**
   * Step 3: Save the reply to Firestore
   */
  const data = toFirestoreEntry(replyData);

  const reply = await addDoc(
    collection(db, THREADS_COLLECTION_NAME, thread.key, REPLIES_COLLECTION),
    data,
  );

  /**
   * Step 4: Update parent thread metadata (reply count and last activity time)
   */
  // Update the thread with the new reply count and flow time (last reply/update/change time)
  await updateDoc(doc(db, THREADS_COLLECTION_NAME, thread.key), {
    replyCount: increment(1),
    flowTime: serverTimestamp(),
  });

  /**
   * Step 5: Initialize reaction system for the new reply
   */
  // Add a notification to the thread creator (the first owner of the thread)
  const targetTitle =
    markdownContent.length > 50 // Fixed typo
      ? `${markdownContent.substring(0, 50)}...`
      : markdownContent;

  const reactions: Reactions = {
    subscribers: [author], // ✅ Only the reply author should be subscribed to their own reply
    love: [],
  };
  // Add the reactions to the reply
  await setDoc(doc(db, REACTIONS_COLLECTION_NAME, reply.id), reactions);

  /**
   * Step 6: Send notification to thread owner (fire-and-forget)
   */
  // If the author of the reply is the same as the thread creator,
  // we don't need to add a notification to the thread creator
  if (thread.owners.includes(author)) return;

  const notification = NotificationRequestSchema.parse({
    notification: {
      key: '',
      targetType: 'thread.reply',
      targetKey: thread.key,
      targetTitle,
      message: createPlainSnippet(markdownContent, 120), // Fixed typo
    },
    // Intentionally only notify the first owner of the thread (i.e.)
    // the thread creator, not all owners.
    recipients: [thread.owners[0]],
    from: author,
  });

  // Add a notification for the thread owner. We do not wait
  // for this to complete, as it is not critical for the notification
  // to be sent immediately, or at all. Ie. Notifications are a convienience
  // feature, not a critical feature.
  authedPost('/api/notifications/send', {
    body: notification,
  }).catch((error) => {
    // Log but don't throw - notifications are non-critical
    logWarn('addReply', 'Failed to send notification:', error);
  });
}
