import {
  ACCOUNTS_COLLECTION_NAME,
  type Account,
  parseAccount,
} from 'src/schemas/AccountSchema';

export async function getAllAccounts() {
  const { getFirestore, getDocs, collection } = await import(
    'firebase/firestore'
  );
  const accountDocs = getDocs(
    collection(getFirestore(), ACCOUNTS_COLLECTION_NAME),
  );

  const accounts: Account[] = [];

  for (const doc of (await accountDocs).docs) {
    accounts.push(parseAccount(doc.data(), doc.id));
  }

  accounts.sort(
    (a, b) => (b.lastLogin?.getTime() || 0) - (a?.lastLogin?.getTime() || 0),
  );

  return accounts;
}
