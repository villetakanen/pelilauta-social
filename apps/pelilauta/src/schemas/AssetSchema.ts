import { logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { LICENSE_KEYS, LicenseSchema } from './LicenseSchema';

export const ASSETS_COLLECTION_NAME = 'assets';

/**
 * @deprecated Use LICENSE_KEYS from LicenseSchema instead
 * Kept for backward compatibility during migration
 */
export const ASSET_LICENSES_KEYS = LICENSE_KEYS;

/**
 * @deprecated Use LicenseSchema from LicenseSchema instead
 * Kept for backward compatibility during migration
 */
export const ASSET_LICENSES = LicenseSchema;

/**
 * Enhanced Asset schema with tracking metadata.
 *
 * Phase 2 (Non-breaking): All new fields are optional to maintain
 * backward compatibility with existing assets in Firestore.
 *
 * Future phases will make some fields required after data migration.
 */
export const AssetSchema = z.object({
  // Core required fields
  url: z.string(),

  // Metadata fields (optional for backward compatibility)
  name: z.string().default(''),
  description: z.string().default(''),
  license: z.string().default('0'),

  // Storage metadata (should be required, but optional during migration)
  mimetype: z.string().optional(),
  storagePath: z.string().optional(),

  // NEW: Tracking metadata (Phase 2)
  size: z.number().optional(), // File size in bytes
  uploadedAt: z.string().optional(), // ISO timestamp
  uploadedBy: z.string().optional(), // User ID who uploaded

  // NEW: Image-specific metadata (Phase 2)
  width: z.number().optional(), // Image width in pixels
  height: z.number().optional(), // Image height in pixels
});

export type Asset = z.infer<typeof AssetSchema>;

/**
 * Parses raw data into a validated Asset object.
 * Logs validation errors and re-throws for caller to handle.
 */
export function parseAsset(data: Record<string, unknown>): Asset {
  try {
    return AssetSchema.parse({
      ...data,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      logError('AssetSchema validation error:', err.issues);
    }
    throw err;
  }
}

/**
 * Helper to create a complete Asset metadata object with all tracking fields.
 * Use this when uploading new assets to ensure consistent metadata.
 *
 * @param url - Download URL from Firebase Storage
 * @param storagePath - Full path in Firebase Storage (e.g., 'Sites/siteKey/uuid-filename.png')
 * @param file - The File object being uploaded
 * @param uploadedBy - User ID of the uploader
 * @param additionalData - Optional additional metadata (name, description, license, dimensions)
 * @returns Fully populated Asset object with all metadata
 *
 * @example
 * const asset = createAssetMetadata(
 *   downloadURL,
 *   storagePath,
 *   file,
 *   userId,
 *   { name: 'My Image', description: 'A cool image', license: 'cc-by' }
 * );
 */
export function createAssetMetadata(
  url: string,
  storagePath: string,
  file: File,
  uploadedBy: string,
  additionalData?: Partial<Asset>,
): Asset {
  const metadata: Record<string, unknown> = {
    url,
    storagePath,
    name: additionalData?.name || file.name,
    description: additionalData?.description || '',
    license: additionalData?.license || '0',
    mimetype: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };

  // Only include width and height if they are defined (not undefined)
  // Firestore doesn't accept undefined values
  if (additionalData?.width !== undefined) {
    metadata.width = additionalData.width;
  }
  if (additionalData?.height !== undefined) {
    metadata.height = additionalData.height;
  }

  return parseAsset(metadata);
}
