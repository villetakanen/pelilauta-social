import type { Thread } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Creates a new thread using the server-side API endpoint.
 * This replaces the old client-side addThread function.
 *
 * @param thread - Partial thread data
 * @param files - Array of files to upload
 * @returns Promise<string> - The created thread key
 */
export async function createThreadApi(
  thread: Partial<Thread>,
  files: File[],
): Promise<string> {
  const endpointName = 'createThreadApi';

  try {
    logDebug(endpointName, 'Creating thread via API', {
      title: thread.title,
      channel: thread.channel,
      filesCount: files.length,
    });

    // Get the current user's auth token
    const { auth } = await import('@firebase/client');
    const { getIdToken } = await import('firebase/auth');

    logDebug(endpointName, 'Auth state', {
      currentUser: !!auth.currentUser,
      userUid: auth.currentUser?.uid,
    });

    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await getIdToken(auth.currentUser);

    // Prepare form data
    const formData = new FormData();

    // Add required fields
    formData.append('title', thread.title || '');
    formData.append('markdownContent', thread.markdownContent || '');
    formData.append('channel', thread.channel || '');

    // Add optional fields
    if (thread.siteKey) {
      formData.append('siteKey', thread.siteKey);
    }

    if (thread.youtubeId) {
      formData.append('youtubeId', thread.youtubeId);
    }

    if (thread.poster) {
      formData.append('poster', thread.poster);
    }

    if (thread.tags && thread.tags.length > 0) {
      formData.append('tags', JSON.stringify(thread.tags));
    }

    // Add public flag (defaults to true)
    const isPublic = thread.public !== false; // Default to true if undefined
    formData.append('public', isPublic.toString());

    // Add files
    for (let i = 0; i < files.length; i++) {
      formData.append(`file_${i}`, files[i]);
    }

    // Make the API request
    logDebug(endpointName, 'Making API request');
    const response = await fetch('/api/threads/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    logDebug(endpointName, 'API response received', {
      status: response.status,
      statusText: response.statusText,
    });

    const responseData = await response.json();

    if (!response.ok) {
      logError(endpointName, 'API request failed', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
      });
      throw new Error(
        responseData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    if (!responseData.success || !responseData.threadKey) {
      throw new Error('Invalid response from server');
    }

    logDebug(endpointName, 'Thread created successfully', {
      threadKey: responseData.threadKey,
    });

    return responseData.threadKey;
  } catch (error) {
    logError(endpointName, 'Failed to create thread:', error);
    throw error;
  }
}
