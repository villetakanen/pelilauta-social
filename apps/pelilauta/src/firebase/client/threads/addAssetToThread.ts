import {
  generateStoragePath,
  type StorageUploadResult,
  uploadToStorage,
  validateFileSize,
  validateFileType,
} from 'src/utils/client/assetUploadHelpers';
import { logError } from 'src/utils/logHelpers';

const THREAD_ASSET_ALLOWED_TYPES = ['image/*'];

/**
 * Uploads an image asset to a thread's storage location
 * Note: This function does NOT update Firestore - caller is responsible for that
 *
 * @param threadKey - The thread key
 * @param file - The image file to upload
 * @returns Object containing downloadURL and storagePath
 * @throws Error if file is not an image or upload fails
 */
export async function addAssetToThread(
  threadKey: string,
  file: File,
): Promise<StorageUploadResult> {
  if (!threadKey || !file || !file.name) {
    throw new Error('Invalid thread or file provided, aborting asset upload');
  }

  // Validate file type (images only for threads)
  validateFileType(file, THREAD_ASSET_ALLOWED_TYPES);
  validateFileSize(file);

  // Upload to storage
  const storagePath = generateStoragePath('Threads', threadKey, file.name);

  try {
    return await uploadToStorage(file, storagePath);
  } catch (error) {
    logError('addAssetToThread', 'Upload failed:', error);
    throw error;
  }
}
