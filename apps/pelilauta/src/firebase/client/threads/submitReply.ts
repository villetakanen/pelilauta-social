import type { Thread } from 'src/schemas/ThreadSchema';
import { logDebug } from 'src/utils/logHelpers';

/**
 * Submits a reply using the new API endpoint with improved UX
 *
 * This function:
 * 1. Creates a FormData object with all reply data and files
 * 2. Sends it to the new /api/threads/add-reply endpoint
 * 3. Returns quickly with 202 Accepted while background tasks continue
 *
 * @param thread - The thread to add the reply to
 * @param markdownContent - The reply content in markdown format
 * @param quoteref - Optional reference to quoted message/reply key
 * @param files - Optional array of files to upload and attach to the reply
 * @returns Promise that resolves when reply is successfully submitted (not necessarily fully processed)
 * @throws Error if reply submission fails
 */
export async function submitReply(
  thread: Thread,
  markdownContent: string,
  quoteref?: string,
  files: File[] = [],
): Promise<{ replyId: string }> {
  logDebug('submitReply', `Submitting reply to thread ${thread.key}`);

  // Create FormData for multipart/form-data request
  const formData = new FormData();
  formData.append('threadKey', thread.key);
  formData.append('markdownContent', markdownContent);

  if (quoteref) {
    formData.append('quoteref', quoteref);
  }

  // Add files with numbered keys to avoid conflicts
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  // Get auth token
  const { getAuth } = await import('firebase/auth');
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();

  // Submit to API endpoint
  const response = await fetch('/api/threads/add-reply', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to submit reply');
  }

  logDebug('submitReply', `Reply submitted successfully: ${result.replyId}`);

  return { replyId: result.replyId };
}
