import {
  PAGES_COLLECTION_NAME,
  type Page,
  parsePage,
} from 'src/schemas/PageSchema';
import { SITES_COLLECTION_NAME } from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { toFirestoreEntry } from 'src/utils/client/toFirestoreEntry';
import { db } from '..';
import { updatePageRef } from './updatePageRef';
import { updatePageTags } from './updatePageTags';

async function setPageToFirestore(
  siteKey: string,
  page: Partial<Page>,
  key: string,
) {
  const { setDoc, doc } = await import('firebase/firestore');
  const fsPage = toFirestoreEntry(page);
  await setDoc(
    doc(db, SITES_COLLECTION_NAME, siteKey, PAGES_COLLECTION_NAME, key),
    fsPage,
  );
}

export async function setPage(
  siteKey: string,
  page: Partial<Page>,
  key: string,
) {
  const { getDoc, doc } = await import('firebase/firestore');
  await setPageToFirestore(siteKey, page, key);

  const pageDoc = await getDoc(
    doc(db, SITES_COLLECTION_NAME, siteKey, PAGES_COLLECTION_NAME, key),
  );
  if (!pageDoc.exists()) throw new Error('updatePage: Page not found');

  // Then we need to update the page references
  const updatedPage = parsePage(
    toClientEntry(pageDoc.data() as Record<string, unknown>),
    key,
  );
  await updatePageRef(updatedPage);
  await updatePageTags(updatedPage);

  // Trigger cache purging for the SSR page routes
  // This is done asynchronously to avoid blocking the update operation
  try {
    const { purgeCacheForPage } = await import('../cache/purgeCacheHelpers');
    await purgeCacheForPage(siteKey, key);
  } catch (error) {
    // Cache purging failures should not block page updates
    const { logDebug } = await import('../../../utils/logHelpers');
    logDebug(
      'setPage',
      'Cache purging failed but page update succeeded',
      error,
    );
  }
}
