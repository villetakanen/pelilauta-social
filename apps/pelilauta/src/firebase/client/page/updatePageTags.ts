import type { Page } from 'src/schemas/PageSchema';
import { TAG_FIRESTORE_COLLECTION } from 'src/schemas/TagSchema';
import { logError } from 'src/utils/logHelpers';
import { toTagData } from 'src/utils/shared/toTagData';

async function removeTags(key: string) {
  // remove the page tags entry from the tags collection
  const { getFirestore, deleteDoc, doc } = await import('firebase/firestore');
  try {
    await deleteDoc(doc(getFirestore(), TAG_FIRESTORE_COLLECTION, key));
  } catch (e) {
    logError('removeTags', e);
  }
}

async function setTags(page: Page) {
  // set the page tags entry to the tags collection
  const { getFirestore, setDoc, doc } = await import('firebase/firestore');

  const tagData = toTagData(
    page,
    `${page.siteKey}/${page.key}`,
    'page',
    page.flowTime,
  );

  try {
    await setDoc(
      doc(getFirestore(), TAG_FIRESTORE_COLLECTION, page.key),
      tagData,
    );
  } catch (e) {
    logError('setTags', e);
  }
}

export async function updatePageTags(page: Page) {
  const tags = page.tags;
  if (!tags) {
    await removeTags(page.key);
  } else {
    await setTags(page);
  }
}
