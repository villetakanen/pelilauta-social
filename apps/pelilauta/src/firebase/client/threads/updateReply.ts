import { logDebug } from 'src/utils/logHelpers';

/**
 * Updates a reply using the API endpoint
 *
 * @param threadKey - The key of the thread
 * @param replyKey - The key of the reply to update
 * @param markdownContent - The new reply content in markdown format
 * @param files - Optional array of new files to upload and attach to the reply
 * @returns Promise that resolves when reply is successfully updated
 * @throws Error if reply update fails
 */
export async function updateReply(
  threadKey: string,
  replyKey: string,
  markdownContent: string,
  files: File[] = [],
): Promise<void> {
  logDebug('updateReply', `Updating reply ${replyKey} in thread ${threadKey}`);

  // Create FormData for multipart/form-data request
  const formData = new FormData();
  formData.append('threadKey', threadKey);
  formData.append('replyKey', replyKey);
  formData.append('markdownContent', markdownContent);

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
  const response = await fetch('/api/threads/update-reply', {
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
    throw new Error(result.error || 'Failed to update reply');
  }

  logDebug('updateReply', `Reply updated successfully: ${replyKey}`);
}
