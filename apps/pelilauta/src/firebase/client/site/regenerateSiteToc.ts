import { PAGES_COLLECTION_NAME } from 'src/schemas/PageSchema';
import { type PageRef, SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { logWarn } from 'src/utils/logHelpers';
import { toDate } from 'src/utils/schemaHelpers';

/**
 * Regenerates page references for a site.
 *
 * @param siteKey - The key of the site to recreate page references for.
 * @returns The number of pages found for the site
 */
export async function regenerateSiteToc(siteKey: string): Promise<number> {
  logWarn('Forcibly recreating page references for a site');

  // Dynamically import Firebase modules
  const { doc, getDoc, getDocs, collection, updateDoc } = await import(
    'firebase/firestore'
  );
  const { db } = await import('..');

  const siteDoc = await getDoc(doc(db, SITES_COLLECTION_NAME, siteKey));

  if (!siteDoc.exists()) {
    throw new Error(
      `Site with a key ${siteKey} does not exist, aborting pageRefs recreation.`,
    );
  }

  const refs: PageRef[] = [];

  const pages = await getDocs(
    collection(db, SITES_COLLECTION_NAME, siteKey, PAGES_COLLECTION_NAME),
  );

  for (const pageDoc of pages.docs) {
    const ref = {
      key: pageDoc.id,
      name: pageDoc.data().name,
      author: pageDoc.data().owners?.[0] || siteDoc.data().owners[0],
      category: pageDoc.data().category || '',
      flowTime: toDate(pageDoc.data().flowTime).getTime(),
    };
    refs.push(ref);
  }

  if (!refs.length) {
    throw new Error(
      'No pages found for the site, aborting pageRefs recreation.',
    );
  }

  await updateDoc(doc(db, SITES_COLLECTION_NAME, siteKey), {
    pageRefs: refs,
  });

  logWarn(
    `Page references for the site ${siteKey} have been recreated. We found ${refs.length} pages.`,
  );

  return refs.length;
}
