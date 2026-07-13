import type { Thread } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * Updates an existing thread using the server-side API endpoint.
 * This replaces the old client-side updateThread function.
 *
 * @param thread - Partial thread data with key required
 * @param silent - If true, doesn't update flowTime (for metadata-only updates)
 * @returns Promise<void>
 */
export async function updateThreadApi(
  thread: Partial<Thread>,
  silent = false,
): Promise<void> {
  const endpointName = 'updateThreadApi';

  if (!thread.key) {
    throw new Error('Thread key is required to update thread');
  }

  try {
    logDebug(endpointName, 'Updating thread via API', {
      threadKey: thread.key,
      fields: Object.keys(thread),
      silent,
    });

    // Get the current user's auth token
    const { auth } = await import('@firebase/client');
    const { getIdToken } = await import('firebase/auth');

    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await getIdToken(auth.currentUser);

    // Prepare request body (exclude key, include silent flag)
    const { key: _, ...bodyWithoutKey } = thread;
    const body = {
      ...bodyWithoutKey,
      silent,
    };

    // Make the API request
    const response = await fetch(`/api/threads/${thread.key}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    if (!response.ok) {
      logError(endpointName, 'API request failed', {
        status: response.status,
        error: responseData.error,
      });
      throw new Error(
        responseData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    logDebug(endpointName, 'Thread updated successfully', {
      threadKey: thread.key,
    });
  } catch (error) {
    logError(endpointName, 'Failed to update thread:', error);
    throw error;
  }
}
