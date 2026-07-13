import type { APIContext } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { REPLIES_COLLECTION } from 'src/schemas/ReplySchema';
import {
  type ImageArray,
  THREADS_COLLECTION_NAME,
} from 'src/schemas/ThreadSchema';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
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

export async function POST({ request }: APIContext): Promise<Response> {
  const endpointName = '/api/threads/update-reply';

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
    const replyKey = formData.get('replyKey') as string;
    const markdownContent = formData.get('markdownContent') as string;

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    logDebug(
      endpointName,
      `Processing reply update for thread ${threadKey}, reply ${replyKey} with ${files.length} files`,
    );

    // 3. Validate required fields
    if (!threadKey || !replyKey || !markdownContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Missing required fields: threadKey, replyKey and markdownContent',
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

    // 4. Fetch reply data to validate existence and ownership
    const replyRef = serverDB
      .collection(THREADS_COLLECTION_NAME)
      .doc(threadKey)
      .collection(REPLIES_COLLECTION)
      .doc(replyKey);

    const replyDoc = await replyRef.get();

    if (!replyDoc.exists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Reply not found',
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

    const replyData = replyDoc.data();

    // Check ownership
    if (!replyData?.owners || !replyData.owners.includes(uid)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: You can only edit your own replies',
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

    // 5. Upload new files if any
    const uploadedImages: ImageArray = [];
    // Keep existing images if not replaced (logic depends on UI, assuming append for now or full replace?)
    // For MVP, let's assume we are adding new images or keeping existing ones if UI sends them back?
    // Actually, usually update replaces the content.
    // If we want to keep existing images, the UI should probably send them or we should handle it.
    // For simplicity and matching add-reply, let's just upload new ones.
    // If the UI supports removing images, it should probably send the final list of images.
    // But `add-reply` only takes files.
    // Let's assume for now we just append new images to existing ones, or maybe the UI handles it?
    // The PBI says "Allow adding/removing images (optional for MVP)".
    // Let's stick to just updating text for now, and if files are provided, add them.
    // To support removing, we'd need to know which existing images to keep.
    // Let's keep it simple: if files are uploaded, they are added. Existing images are kept.
    // If we want to delete images, that's a separate complexity.

    const existingImages = replyData.images || [];

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

    const finalImages = [...existingImages, ...uploadedImages];

    // 6. Update the reply document
    const updateData: Record<string, unknown> = {
      markdownContent,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (finalImages.length > 0) {
      updateData.images = finalImages;
    }

    // IMPORTANT: Do NOT update flowTime

    await replyRef.update(updateData);

    logDebug(endpointName, `Reply updated successfully: ${replyKey}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reply updated successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      },
    );
  } catch (error) {
    logError(endpointName, 'Error processing reply update:', error);
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
