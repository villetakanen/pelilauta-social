import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import type { Asset } from 'src/schemas/AssetSchema';
import {
  SITES_COLLECTION_NAME,
  type Site,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logDebug, logWarn } from 'src/utils/logHelpers';
import { app, db } from '..';

/**
 * Deletes an asset from a site's collection and from Firebase Storage
 *
 * @param site - The site containing the asset
 * @param asset - The asset to delete (must have storagePath)
 * @throws Error if asset doesn't exist in site or Firestore update fails
 */
export async function deleteSiteAsset(
  site: Site,
  asset: Asset | string,
): Promise<void> {
  if (!site.assets) {
    throw new Error('Site does not have any assets');
  }

  // Handle both Asset object and storagePath string for backward compatibility
  const storagePath = typeof asset === 'string' ? asset : asset.storagePath;

  if (!storagePath) {
    throw new Error('Asset must have a storagePath');
  }

  // Remove asset from Firestore
  const siteRef = doc(db, SITES_COLLECTION_NAME, site.key);
  const siteDoc = await getDoc(siteRef);

  if (!siteDoc.exists()) {
    throw new Error(`Site with key ${site.key} not found`);
  }

  const remoteSite = SiteSchema.parse({
    ...toClientEntry(siteDoc.data()),
    key: site.key,
  });
  const assets =
    remoteSite.assets?.filter((a) => a.storagePath !== storagePath) || [];

  await updateDoc(siteRef, { assets });

  logDebug('deleteSiteAsset', `Removed asset from Firestore: ${storagePath}`);

  // Delete from Storage (best effort - don't fail if Storage delete fails)
  if (storagePath) {
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, storagePath);

      await deleteObject(storageRef);
      logDebug('deleteSiteAsset', `Deleted from Storage: ${storagePath}`);
    } catch (error) {
      // Log warning but don't throw - asset is already removed from Firestore
      logWarn(
        'deleteSiteAsset',
        `Failed to delete from Storage: ${storagePath}`,
        error,
      );
    }
  }
}
