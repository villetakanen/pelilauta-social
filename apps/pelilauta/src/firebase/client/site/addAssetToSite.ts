import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { type Asset, createAssetMetadata } from 'src/schemas/AssetSchema';
import {
  SITES_COLLECTION_NAME,
  type Site,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import {
  generateStoragePath,
  getImageDimensions,
  uploadToStorage,
  validateFileSize,
  validateFileType,
} from 'src/utils/client/assetUploadHelpers';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { db } from '..';

// Allowed file types for site assets
const SITE_ASSET_ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'text/plain',
  'text/markdown',
];

/**
 * Adds an asset to a site's asset collection
 *
 * @param site - The site to add the asset to
 * @param file - The file to upload
 * @param uploadedBy - User ID of the uploader
 * @param metadata - Optional additional metadata (name, description, license)
 * @returns The download URL of the uploaded asset
 * @throws Error if site doesn't exist, file validation fails, or upload fails
 */
export async function addAssetToSite(
  site: Site,
  file: File,
  uploadedBy: string,
  metadata: Partial<Pick<Asset, 'name' | 'description' | 'license'>> = {},
): Promise<string> {
  // Validate file
  validateFileType(file, SITE_ASSET_ALLOWED_TYPES);
  validateFileSize(file);

  // Get site document
  const siteRef = doc(db, SITES_COLLECTION_NAME, site.key);
  const siteDoc = await getDoc(siteRef);

  if (!siteDoc.exists()) {
    throw new Error(`Site with key ${site.key} not found`);
  }

  // Upload to storage
  const storagePath = generateStoragePath('Sites', site.key, file.name);
  const { downloadURL } = await uploadToStorage(file, storagePath);

  // Get image dimensions if applicable
  const dimensions = await getImageDimensions(file);

  // Create asset metadata
  const assetData = createAssetMetadata(
    downloadURL,
    storagePath,
    file,
    uploadedBy,
    {
      ...metadata,
      ...(dimensions || {}),
    },
  );

  // Update site's assets array
  const remoteSite = SiteSchema.parse({
    ...toClientEntry(siteDoc.data()),
    key: site.key,
  });
  const assets = remoteSite.assets || [];
  assets.push(assetData);

  // Raw update to site, no need to update metadata fields
  await updateDoc(siteRef, { assets });

  return downloadURL;
}
