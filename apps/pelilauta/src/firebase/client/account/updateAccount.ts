import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  ACCOUNTS_COLLECTION_NAME,
  type Account,
} from 'src/schemas/AccountSchema';
import { db } from '..';

export async function updateAccount(data: Partial<Account>, uid: string) {
  const accountRef = doc(db, ACCOUNTS_COLLECTION_NAME, uid);

  const account = {
    ...data,
    uid,
    createdAt: null, // createdAt is not to be updated, so we set it to null and then prune it
    updatedAt: serverTimestamp(),
  };
  const { createdAt, uid: prunedUid, ...prunedAccount } = account;
  //logDebug('updateAccount', 'prunedAccount', prunedAccount);
  await updateDoc(accountRef, prunedAccount);
}
