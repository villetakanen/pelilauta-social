import { type Page, PageSchema, parsePage } from 'src/schemas/PageSchema';
import { uid } from 'src/stores/session';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logDebug } from 'src/utils/logHelpers';
import { addPageRevision } from './addPageRevision';
import { updatePageRef } from './updatePageRef';
import { updatePageTags } from './updatePageTags';

/**
 * A fairly complex page update helper.
 *
 * This function updates a page document in Firestore and performs several related operations:
 * 1. Adds a revision to the page history.
 * 2. Updates the page document with the provided changes.
 * 3. re-reads the updated page document, for any fields managed by the firestore (dates, etc).
 * 4. Updates the page references in the site, and site updatedAt field.
 * 5. Updates the tags entries for the tags found in the page.
 *
 * Steps 3-5 should be moved to a server side function, or a cloud function, as they all can be
 * triggered by the page update, and are not strictly necessary to be done in the client.
 *
 * @param siteKey
 * @param pageKey
 * @param changes
 */
export async function updatePage(
  siteKey: string,
  pageKey: string,
  changes: Partial<Page>,
) {
  const { getFirestore, doc, updateDoc, getDoc } = await import(
    'firebase/firestore'
  );
  const { toFirestoreEntry } = await import(
    'src/utils/client/toFirestoreEntry'
  );
  const db = getFirestore();
  const u = uid.get();

  if (!u) {
    throw new Error('Cannot update page: user not authenticated');
  }

  // Lets first get the page document
  const pageRef = doc(db, 'sites', siteKey, 'pages', pageKey);

  const currentPagedoc = await getDoc(pageRef);
  if (!currentPagedoc.exists())
    throw new Error('updatePage: Page not found before update');
  const current = PageSchema.parse(
    toClientEntry({
      ...(currentPagedoc.data() as Record<string, unknown>),
      key: pageKey,
      siteKey,
    }),
  );

  // We'll add a revision to the page history
  await addPageRevision(current, changes);

  // Prepare updated changes with author
  const updatedChanges = {
    ...changes,
    author: u,
  };

  // Ensure editor is in owners array
  if (!current.owners.includes(u)) {
    updatedChanges.owners = [...current.owners, u];
  }

  // Then we'll update the page document with the changes
  await updateDoc(pageRef, toFirestoreEntry(updatedChanges));

  logDebug('Page document and history updated');

  const pageDoc = await getDoc(pageRef);

  if (!pageDoc.exists())
    throw new Error('updatePage: Page not found after update');

  // Then we need to update the page references
  const updatedPage = parsePage(
    toClientEntry(pageDoc.data() as Record<string, unknown>),
    pageKey,
    siteKey,
  );

  await updatePageRef(updatedPage);

  logDebug('Page references updated', { siteKey, pageKey });

  await updatePageTags(updatedPage);

  logDebug('Page tags updated', { siteKey, pageKey });

  // Trigger cache purging for the SSR page routes
  // This is done asynchronously to avoid blocking the update operation
  try {
    const { purgeCacheForPage } = await import('../cache/purgeCacheHelpers');
    await purgeCacheForPage(siteKey, pageKey);
  } catch (error) {
    // Cache purging failures should not block page updates
    logDebug(
      'updatePage',
      'Cache purging failed but page update succeeded',
      error,
    );
  }
}
