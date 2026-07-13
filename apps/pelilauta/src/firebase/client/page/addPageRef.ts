import {
  type PageRef,
  SITES_COLLECTION_NAME,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { db } from '..';
import { updateSiteApi } from '../site/updateSiteApi';

export async function addPageRef(pageRef: PageRef, siteKey: string) {
  // Get the siteDoc and Site from the firestore
  const { getDoc, doc } = await import('firebase/firestore');
  const siteDoc = await getDoc(doc(db, SITES_COLLECTION_NAME, siteKey));
  if (!siteDoc.exists()) throw new Error('addPageRef: Site not found');
  const site = SiteSchema.parse({
    ...toClientEntry(siteDoc.data()),
    key: siteKey,
  });

  // Clone the pageRefs array and add the new pageRef
  const refs: PageRef[] = site.pageRefs ? [...site.pageRefs] : [];

  // Check if this slug exists in the pageRefs, if it does, replace it
  const existingIndex = refs.findIndex((ref) => ref.key === pageRef.key);
  if (existingIndex !== -1) {
    refs[existingIndex] = pageRef;
  } else {
    // Add the new pageRef to the refs
    refs.push(pageRef);
  }

  // Update the site with the new pageRefs
  await updateSiteApi({ pageRefs: refs, key: siteKey });
}
