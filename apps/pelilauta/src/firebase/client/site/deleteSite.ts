import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
import { SITES_COLLECTION_NAME, type Site } from 'src/schemas/SiteSchema';
import { logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import { app, db } from '..';

/**
 * A Sites assets are stored in firebase storage `/Sites/{site.key}/`.
 *
 * As a site is deleted, we need to delete this folder and all its contents,
 * if it exists.
 *
 * @param site [Site] The site to delete assets for
 */
async function deleteAssets(site: Site) {
  const { getStorage } = await import('firebase/storage');
  const storage = getStorage(app);
  const siteAssetsRef = ref(storage, `Sites/${site.key}/`);

  try {
    // Check if the folder exists
    const listResult = await listAll(siteAssetsRef);

    // If the folder exists, delete all files within it
    if (listResult.items.length > 0) {
      const deletePromises = listResult.items.map((itemRef) =>
        deleteObject(itemRef),
      );
      await Promise.all(deletePromises);
    }
  } catch (error) {
    // Handle potential errors (e.g., if the folder doesn't exist)
    logError('Error deleting site assets', error);
  }
}

export async function deleteSite(site: Site) {
  if (!uid.get()) {
    throw new Error('Site deletion aborted, session uid not set');
  }

  // Sanity check, the database will throw an error
  // if the uid is not in the owners list at the DB side
  if (!site.owners.includes(uid.get())) {
    throw new Error('Site deletion aborted, user is not an owner');
  }

  // Delete the site assets
  await deleteAssets(site);

  // Delete the site from the database
  await deleteDoc(doc(db, SITES_COLLECTION_NAME, site.key));
}
