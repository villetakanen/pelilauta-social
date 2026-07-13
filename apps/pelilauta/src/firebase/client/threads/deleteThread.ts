import type { Thread } from '@schemas/ThreadSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { authedDelete } from '../apiClient';

/**
 * Deletes a thread by calling the server-side API endpoint.
 *
 * @param thread The thread object to be deleted.
 * @throws Throws an error if the deletion fails.
 */
export async function deleteThread(thread: Thread): Promise<void> {
  if (!thread.key) {
    throw new Error('Thread key is required to delete a thread');
  }

  logDebug('deleteThread', 'Initiating thread deletion via API', {
    threadKey: thread.key,
  });

  try {
    const response = await authedDelete(`/api/threads/${thread.key}`);

    if (response.status !== 202) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    logDebug('deleteThread', 'Thread deletion accepted by API', {
      threadKey: thread.key,
    });
  } catch (error) {
    logError('deleteThread', 'Failed to delete thread:', error);
    throw error;
  }
}
