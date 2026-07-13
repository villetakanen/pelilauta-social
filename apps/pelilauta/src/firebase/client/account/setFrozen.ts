import { ACCOUNTS_COLLECTION_NAME } from 'src/schemas/AccountSchema';
import { logError } from 'src/utils/logHelpers';

export async function setFrozen(frozen: boolean, accountUid: string) {
  const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
  const { uid } = await import('../../../stores/session');
  const { appMeta } = await import('src/stores/metaStore/metaStore');

  if (!appMeta.get().admins.includes(uid.get())) {
    logError(
      'Aborted setFrozen: Firestore would stop the operation due to security rules',
    );
    throw new Error('Unauthorized');
  }

  const accountRef = doc(getFirestore(), ACCOUNTS_COLLECTION_NAME, accountUid);

  await updateDoc(accountRef, {
    frozen,
  });
}
