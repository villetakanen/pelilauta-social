import { app } from 'src/firebase/client';
import { logDebug, logError } from 'src/utils/logHelpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Maximum allowed file size for asset uploads (10MB)
 * Can be overridden per-upload by passing custom maxSizeBytes to validateFileSize()
 */
export const ASSET_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Result object returned by storage upload operations
 */
export interface StorageUploadResult {
  downloadURL: string;
  storagePath: string;
}

/**
 * Image dimensions extracted from a File object
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validates that a file's size does not exceed the maximum allowed size.
 *
 * @param file - The File object to validate
 * @param maxSizeBytes - Maximum allowed size in bytes (default: ASSET_MAX_SIZE_BYTES)
 * @throws Error if file size exceeds the limit
 *
 * @example
 * validateFileSize(file); // Uses default 10MB limit
 * validateFileSize(file, 5 * 1024 * 1024); // Custom 5MB limit
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = ASSET_MAX_SIZE_BYTES,
): void {
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(2);
    throw new Error(
      `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    );
  }
}

/**
 * Validates that a file's mimetype matches one of the allowed patterns.
 * Supports wildcard patterns like "image/*".
 *
 * @param file - The File object to validate
 * @param allowedTypes - Array of allowed mimetype patterns
 * @throws Error if file type is not in the allowed list
 *
 * @example
 * validateFileType(file, ['image/*']); // Allows any image
 * validateFileType(file, ['image/png', 'image/jpeg']); // Specific types only
 * validateFileType(file, ['image/*', 'application/pdf']); // Mixed patterns
 */
export function validateFileType(file: File, allowedTypes: string[]): void {
  const isAllowed = allowedTypes.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return file.type.startsWith(prefix);
    }
    return file.type === pattern;
  });

  if (!isAllowed) {
    throw new Error(
      `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    );
  }
}

/**
 * Generates a unique storage path for an asset with UUID-prefixed filename.
 *
 * @param category - Storage category ('Sites', 'Threads', or 'Profiles')
 * @param categoryId - The ID of the site, thread, or profile
 * @param filename - Original filename
 * @returns Full storage path (e.g., "Sites/site123/uuid-filename.png")
 *
 * @example
 * generateStoragePath('Sites', 'site123', 'image.png')
 * // Returns: "Sites/site123/550e8400-e29b-41d4-a716-446655440000-image.png"
 */
export function generateStoragePath(
  category: 'Sites' | 'Threads' | 'Profiles',
  categoryId: string,
  filename: string,
): string {
  const uniqueFilename = `${uuidv4()}-${filename}`;
  return `${category}/${categoryId}/${uniqueFilename}`;
}

/**
 * Uploads a file to Firebase Storage at the specified path.
 * This is a low-level utility - use specific upload functions for business logic.
 *
 * @param file - The File object to upload
 * @param storagePath - Full storage path where file should be uploaded
 * @returns Promise resolving to StorageUploadResult with downloadURL and storagePath
 * @throws Error if upload fails
 *
 * @example
 * const result = await uploadToStorage(file, 'Sites/site123/uuid-image.png');
 * console.log(result.downloadURL); // https://firebasestorage.googleapis.com/...
 */
export async function uploadToStorage(
  file: File,
  storagePath: string,
): Promise<StorageUploadResult> {
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import(
    'firebase/storage'
  );
  const storage = getStorage(app);
  const storageRef = ref(storage, storagePath);

  try {
    logDebug('uploadToStorage', `Uploading to: ${storagePath}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    logDebug('uploadToStorage', `Upload successful: ${downloadURL}`);

    return { downloadURL, storagePath };
  } catch (error) {
    logError('uploadToStorage', 'Upload failed:', error);
    throw error;
  }
}

/**
 * Extracts width and height dimensions from an image File object.
 * Returns undefined if the file is not an image or dimensions cannot be determined.
 *
 * @param file - The File object to analyze
 * @returns Promise resolving to ImageDimensions or undefined
 *
 * @example
 * const dimensions = await getImageDimensions(imageFile);
 * if (dimensions) {
 *   console.log(`${dimensions.width}x${dimensions.height}`);
 * }
 */
export async function getImageDimensions(
  file: File,
): Promise<ImageDimensions | undefined> {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(undefined);
    };

    img.src = objectUrl;
  });
}
