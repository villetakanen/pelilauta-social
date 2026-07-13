import { CLOCKS_COLLECTION_NAME } from 'src/schemas/ClockSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';

/**
 * Deletes a clock from a site and updates the table of contents.
 *
 * Authorization is done with the firebase security rules, so this function
 * will throw an error if the user is not authorized to delete the clock.
 *
 * @param siteKey - The key of the site.
 * @param key - The key of the clock.
 */
export async function deleteClock(siteKey: string, key: string) {
  const { deleteDoc, getFirestore, doc } = await import('firebase/firestore');

  await deleteDoc(
    doc(
      getFirestore(),
      SITES_COLLECTION_NAME,
      siteKey,
      CLOCKS_COLLECTION_NAME,
      key,
    ),
  );
}
