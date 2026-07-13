import type { APIContext } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { NotificationRequestSchema } from 'src/schemas/NotificationSchema';
import {
  REACTIONS_COLLECTION_NAME,
  type Reactions,
} from 'src/schemas/ReactionsSchema';
import { REPLIES_COLLECTION, type Reply } from 'src/schemas/ReplySchema';
import {
  type ImageArray,
  parseThread,
  THREADS_COLLECTION_NAME,
  type Thread,
} from 'src/schemas/ThreadSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { createPlainSnippet } from 'src/utils/snippetHelpers';
import { v4 as uuidv4 } from 'uuid';
import { serverApp, serverDB } from '../../../firebase/server';

interface UploadedFile {
  url: string;
  alt: string;
}

/**
 * Uploads a file to Firebase Storage and returns the download URL
 */
async function uploadFileToStorage(
  threadKey: string,
  file: File,
): Promise<UploadedFile> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type, only images are allowed for threads');
  }

  const storage = getStorage(serverApp);
  const bucket = storage.bucket();

  const uniqueFilename = `${uuidv4()}-${file.name}`;
  const storagePath = `Threads/${threadKey}/${uniqueFilename}`;

  // Convert File to Buffer for server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const cloudFile = bucket.file(storagePath);

  await cloudFile.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  // Make the file publicly readable
  await cloudFile.makePublic();

  // Get the public URL
  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  return {
    url,
    alt: file.name,
  };
}

/**
 * Background tasks that run after the reply is created
 * These are non-critical and should not block the API response
 */
function executeBackgroundTasks(
  threadKey: string,
  replyId: string,
  author: string,
  markdownContent: string,
  thread: Thread,
): void {
  // Use setTimeout to queue background tasks without blocking the response
  setTimeout(async () => {
    try {
      logDebug(
        'addReply:background',
        'Starting background tasks for reply',
        replyId,
      );

      // Task 1: Update thread metadata (reply count and flow time)
      await serverDB
        .collection(THREADS_COLLECTION_NAME)
        .doc(threadKey)
        .update({
          replyCount: FieldValue.increment(1),
          flowTime: FieldValue.serverTimestamp(),
        });

      logDebug('addReply:background', 'Updated thread metadata');

      // Task 2: Initialize reaction system for the new reply
      const reactions: Reactions = {
        subscribers: [author], // Only the reply author should be subscribed to their own reply
        love: [],
      };

      await serverDB
        .collection(REACTIONS_COLLECTION_NAME)
        .doc(replyId)
        .set(reactions);

      logDebug('addReply:background', 'Created reactions document');

      // Task 3: Send notification to thread owner (if different from reply author)
      if (!thread.owners.includes(author)) {
        const targetTitle =
          markdownContent.length > 50
            ? `${markdownContent.substring(0, 50)}...`
            : markdownContent;

        const notification = NotificationRequestSchema.parse({
          notification: {
            key: '',
            targetType: 'thread.reply',
            targetKey: thread.key,
            targetTitle,
            message: createPlainSnippet(markdownContent, 120),
          },
          recipients: [thread.owners[0]], // Only notify the thread creator
          from: author,
        });

        // Create notification directly in Firestore
        const base = notification.notification;
        const notificationDoc = {
          ...base,
          key: `${base.targetKey}-${base.targetType}-${notification.from}-${thread.owners[0]}`,
          createdAt: FieldValue.serverTimestamp(),
          to: thread.owners[0],
          from: author,
          read: false,
        };

        await serverDB
          .collection('notifications')
          .doc(notificationDoc.key)
          .set(notificationDoc);

        logDebug('addReply:background', 'Sent notification to thread owner');
      }

      logDebug(
        'addReply:background',
        'All background tasks completed successfully',
      );
    } catch (error) {
      // Log but don't throw - background tasks are non-critical
      logError('addReply:background', 'Background task failed:', error);
    }
  }, 0); // Queue immediately but non-blocking
}

export async function POST({ request }: APIContext): Promise<Response> {
  const endpointName = '/api/threads/add-reply';

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

    // 2. Parse multipart form data
    const formData = await request.formData();

    const threadKey = formData.get('threadKey') as string;
    const markdownContent = formData.get('markdownContent') as string;
    const quoteref = formData.get('quoteref') as string | null;

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    logDebug(
      endpointName,
      `Processing reply for thread ${threadKey} with ${files.length} files`,
    );

    // 3. Validate required fields
    if (!threadKey || !markdownContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: threadKey and markdownContent',
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

    // 4. Fetch thread data to validate it exists and get metadata
    const threadDoc = await serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey)
      .get();
    if (!threadDoc.exists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Thread not found',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }

    const thread = parseThread(
      threadDoc.data() as Record<string, unknown>,
      threadDoc.id,
    );

    // 5. **CRITICAL TASK (SYNCHRONOUS)**: Upload files and create reply document
    const uploadedImages: ImageArray = [];

    // Upload files first (this is the potentially slow part we need to do synchronously)
    for (const file of files) {
      try {
        const uploadedFile = await uploadFileToStorage(threadKey, file);
        uploadedImages.push(uploadedFile);
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

    // Create the reply document data structure
    const replyData: Partial<Reply> = {
      threadKey: thread.key,
      markdownContent,
      owners: [uid],
    };

    if (quoteref) {
      replyData.quoteref = quoteref;
    }

    if (uploadedImages.length > 0) {
      replyData.images = uploadedImages;
    }

    // Convert to Firestore format
    const firestoreData = {
      ...replyData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Save the reply to Firestore (this should be fast)
    const replyRef = await serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey)
      .collection(REPLIES_COLLECTION)
      .add(firestoreData);

    const replyId = replyRef.id;

    logDebug(endpointName, `Reply created successfully with ID: ${replyId}`);

    // 6. **EARLY RETURN**: Send 202 Accepted response immediately
    const response = new Response(
      JSON.stringify({
        success: true,
        replyId,
        message: 'Reply created successfully',
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
    executeBackgroundTasks(threadKey, replyId, uid, markdownContent, thread);

    return response;
  } catch (error) {
    logError(endpointName, 'Error processing reply:', error);
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
