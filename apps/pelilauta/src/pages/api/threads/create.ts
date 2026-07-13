import type { APIContext } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ACCOUNTS_COLLECTION_NAME } from 'src/schemas/AccountSchema';
import {
  REACTIONS_COLLECTION_NAME,
  type Reactions,
} from 'src/schemas/ReactionsSchema';
import { SUBSCRIPTIONS_FIRESTORE_PATH } from 'src/schemas/SubscriberSchema';
import { TAG_FIRESTORE_COLLECTION } from 'src/schemas/TagSchema';
import {
  createThread,
  type ImageArray,
  THREADS_COLLECTION_NAME,
  type Thread,
} from 'src/schemas/ThreadSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { toDate } from 'src/utils/schemaHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { toTagData } from 'src/utils/shared/toTagData';
import { serverDB } from '../../../firebase/server';

/**
 * Uploads a file to Firebase Storage and returns the download URL
 */
async function uploadFileToStorage(file: File, uid: string): Promise<string> {
  const storage = getStorage();
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const filePath = `threads/${uid}/${filename}`;

  const bucket = storage.bucket();
  const fileRef = bucket.file(filePath);

  const buffer = Buffer.from(await file.arrayBuffer());

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: uid,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  // Return the download URL
  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: '03-09-2491', // Far future date
  });

  return url;
}

/**
 * Checks if user account is frozen or suspended
 */
async function checkAccountStatus(uid: string): Promise<boolean> {
  try {
    const accountDoc = await serverDB
      .collection(ACCOUNTS_COLLECTION_NAME)
      .doc(uid)
      .get();
    if (!accountDoc.exists) {
      logWarn('createThread', `Account not found for uid: ${uid}`);
      return false; // Account not found, treat as not frozen
    }

    const accountData = accountDoc.data();
    return !!accountData?.frozen; // Return true if frozen, false otherwise
  } catch (error) {
    logError('createThread', 'Error checking account status:', error);
    return false; // On error, don't block (but log for investigation)
  }
}

/**
 * Background tasks that run after the thread is created
 * These are non-critical and should not block the API response
 */
function executeBackgroundTasks(
  threadKey: string,
  thread: Thread,
  uid: string,
): void {
  // Use setTimeout to queue background tasks without blocking the response
  setTimeout(async () => {
    try {
      logDebug(
        'createThread:background',
        'Starting background tasks for thread',
        threadKey,
      );

      // Task 1: Initialize reaction system for the new thread
      const reactions: Reactions = {
        subscribers: [uid], // Thread creator is subscribed to their own thread
        love: [],
      };

      await serverDB
        .collection(REACTIONS_COLLECTION_NAME)
        .doc(threadKey)
        .set(reactions);
      logDebug('createThread:background', 'Created reactions document');

      // Task 2: Update channel thread count in meta/threads collection
      if (thread.channel) {
        try {
          const channelsRef = serverDB.collection('meta').doc('threads');
          const channelsDoc = await channelsRef.get();

          if (channelsDoc.exists) {
            const data = channelsDoc.data();
            const channelsArray = data?.topics || [];

            const channelIndex = channelsArray.findIndex(
              (c: { slug: string }) => c.slug === thread.channel,
            );
            if (channelIndex !== -1) {
              channelsArray[channelIndex].threadCount =
                (channelsArray[channelIndex].threadCount || 0) + 1;

              await channelsRef.update({
                topics: channelsArray,
              });
              logDebug(
                'createThread:background',
                'Updated channel thread count',
              );
            } else {
              logWarn(
                'createThread:background',
                'Channel not found in meta/threads',
              );
            }
          } else {
            logWarn(
              'createThread:background',
              'meta/threads document not found',
            );
          }
        } catch (error) {
          logError(
            'createThread:background',
            'Error updating channel thread count:',
            error,
          );
        }
      }

      // Task 3: Process and update thread tags
      if (thread.tags && thread.tags.length > 0) {
        try {
          const tagData = toTagData(
            { ...thread, owners: [uid] },
            threadKey,
            'thread',
            toDate(thread.flowTime).getTime(),
          );

          await serverDB
            .collection(TAG_FIRESTORE_COLLECTION)
            .doc(threadKey)
            .set(tagData);
          logDebug('createThread:background', 'Created tag document');
        } catch (error) {
          logError(
            'createThread:background',
            'Error creating tag document:',
            error,
          );
        }
      }

      // Task 4: Mark thread as seen for the creator
      try {
        const subscriberRef = serverDB
          .collection(SUBSCRIPTIONS_FIRESTORE_PATH)
          .doc(uid);
        const subscriberDoc = await subscriberRef.get();

        if (subscriberDoc.exists) {
          const currentSeenEntities = subscriberDoc.data()?.seenEntities || {};
          currentSeenEntities[threadKey] = Date.now();

          await subscriberRef.update({
            seenEntities: currentSeenEntities,
          });
          logDebug(
            'createThread:background',
            'Marked thread as seen for creator',
          );
        } else {
          // Create subscriber document if it doesn't exist
          await subscriberRef.set({
            uid,
            allSeenAt: 0,
            seenEntities: { [threadKey]: Date.now() },
            pushMessages: false,
            notifyOnThreads: true,
            notifyOnLikes: true,
            messagingTokens: [],
          });
          logDebug(
            'createThread:background',
            'Created subscriber document and marked thread as seen',
          );
        }
      } catch (error) {
        logError(
          'createThread:background',
          'Error marking thread as seen:',
          error,
        );
      }

      logDebug(
        'createThread:background',
        'All background tasks completed successfully',
      );
    } catch (error) {
      // Log but don't throw - background tasks are non-critical
      logError('createThread:background', 'Background task failed:', error);
    }
  }, 0); // Queue immediately but non-blocking
}

export async function POST({ request }: APIContext): Promise<Response> {
  const endpointName = '/api/threads/create';

  try {
    // 1. Authenticate the request
    const uid = await tokenToUid(request);
    if (!uid) {
      logWarn(endpointName, 'Authentication failed: Invalid or missing token');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or missing token',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }

    // 2. Check account status (frozen/suspended)
    const isFrozen = await checkAccountStatus(uid);
    if (isFrozen) {
      logWarn(
        endpointName,
        `Frozen account attempted to create thread: ${uid}`,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Account suspended',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const markdownContent = formData.get('markdownContent') as string;
    const channel = formData.get('channel') as string;
    const siteKey = formData.get('siteKey') as string | null;
    const youtubeId = formData.get('youtubeId') as string | null;
    const poster = formData.get('poster') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const publicFlag = formData.get('public') as string | null;

    // Parse tags from JSON string if provided
    let tags: string[] | undefined;
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch (_error) {
        logWarn(endpointName, 'Invalid tags JSON format:', tagsString);
        tags = undefined;
      }
    }

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    logDebug(
      endpointName,
      `Processing thread creation for channel ${channel} with ${files.length} files`,
    );

    // 4. Validate required fields
    if (!title || !markdownContent || !channel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: title, markdownContent, and channel',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }

    // 5. **CRITICAL TASK (SYNCHRONOUS)**: Create thread document first, then upload files

    // Create the thread data structure
    const threadData: Partial<Thread> = {
      title,
      markdownContent,
      channel,
      owners: [uid],
      public: publicFlag !== 'false', // Default to true
    };

    if (siteKey) threadData.siteKey = siteKey;
    if (youtubeId) threadData.youtubeId = youtubeId;
    if (poster) threadData.poster = poster;
    if (tags && tags.length > 0) threadData.tags = tags;

    // Create thread object using the factory function
    const thread = createThread(threadData);

    // Convert to Firestore format
    const firestoreData = {
      ...thread,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      flowTime: FieldValue.serverTimestamp(),
    };

    // Remove the key from firestore data as it will be set by the document ID
    const { key, ...firestoreDataWithoutKey } = firestoreData;

    // Save the thread to Firestore (this should be fast)
    const threadRef = await serverDB
      .collection(THREADS_COLLECTION_NAME)
      .add(firestoreDataWithoutKey);

    const threadKey = threadRef.id;

    // Upload files if any (this is the potentially slow part we need to do synchronously)
    const uploadedImages: ImageArray = [];

    if (files.length > 0) {
      for (const file of files) {
        try {
          const uploadedFile = await uploadFileToStorage(file, uid);
          uploadedImages.push({
            url: uploadedFile,
            alt: file.name,
          });
        } catch (error) {
          logError(endpointName, `Failed to upload file ${file.name}:`, error);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to upload file: ${file.name}`,
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              },
            },
          );
        }
      }

      // Update the thread with uploaded images
      await threadRef.update({
        images: uploadedImages,
      });
    }

    logDebug(endpointName, `Thread created successfully with ID: ${threadKey}`);

    // 6. **EARLY RETURN**: Send 202 Accepted response immediately
    const response = new Response(
      JSON.stringify({
        success: true,
        threadKey,
        message: 'Thread created successfully',
      }),
      {
        status: 202, // Accepted - processing continues in background
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );

    // 7. **BACKGROUND TASKS (ASYNCHRONOUS)**: Queue non-critical tasks
    const completeThread = {
      ...thread,
      key: threadKey,
      images: uploadedImages,
    };
    executeBackgroundTasks(threadKey, completeThread, uid);

    return response;
  } catch (_error) {
    logError(endpointName, 'Error processing thread creation:', _error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );
  }
}
