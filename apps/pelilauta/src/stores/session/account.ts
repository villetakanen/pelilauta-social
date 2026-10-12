import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';
import {
  ACCOUNTS_COLLECTION_NAME,
  type Account,
  parseAccount,
} from 'src/schemas/AccountSchema';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { logWarn } from 'src/utils/logHelpers';

const LAST_LOGIN_TIMEOUT = 24 * 60 * 60 * 1000;

export const account = persistentAtom<Account | null>('session-account', null, {
  encode: JSON.stringify,
  decode: (data) => {
    if (!data || data === 'null') return null;
    const object = parseAccount(JSON.parse(data));
    return object;
  },
});
const accountNotFound = atom(false);

// Solid components use $account as a legacy alias.
export const $account = account;

export const requiresEula = computed([account, accountNotFound], (acc, anf) => {
  if (anf) return true;
  if (!acc) return false;
  return !acc.eulaAccepted;
});

// This computed store controls visibility for administrative interface tools. Backend rules enforce administrative authorization.
export const showAdminTools = computed(
  [account, appMeta],
  (account, appMeta) => {
    if (!account) return false;
    if (!account.uid) return false;
    if (appMeta?.admins?.includes(account.uid)) return true;
    return false;
  },
);

let unsubscribe: () => void;
let subscription = 0;

async function handleAccountSnapshot(
  accountData: Partial<Account> | undefined,
  key: string,
  current: () => boolean,
) {
  if (!current()) return;
  if (accountData) {
    try {
      const incoming = parseAccount(accountData, key);

      account.set(incoming);

      const lastLoginTime = incoming.lastLogin?.getTime() || 0;
      if (Date.now() - lastLoginTime > LAST_LOGIN_TIMEOUT) {
        await stampLoginTime(incoming.uid, current);
      }

      if (current()) accountNotFound.set(false);
    } catch (error) {
      logWarn(
        'AccountStore',
        'handleAccountSnapshot',
        'Error parsing account data',
        error,
      );
      handleAccountSnapshot(undefined, key, current);
    }
  } else {
    account.set(null);
    accountNotFound.set(true);
  }
}

export async function subscribe(uid: string, identityCurrent = () => true) {
  const started = ++subscription;
  const current = () => started === subscription && identityCurrent();
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = () => {};
  }

  const { doc, onSnapshot, getFirestore } = await import('firebase/firestore');

  if (!current()) return;
  try {
    const accountRef = doc(getFirestore(), ACCOUNTS_COLLECTION_NAME, uid);
    unsubscribe = onSnapshot(
      accountRef,
      (snapshot) => handleAccountSnapshot(snapshot.data(), uid, current),
      (error) => {
        logWarn(
          'AccountStore',
          'subscribe',
          'Error receiving account snapshot',
          error,
        );
        handleAccountSnapshot(undefined, uid, current);
      },
    );
  } catch (error) {
    logWarn('AccountStore', 'subscribe', 'Error subscribing to account', error);
    handleAccountSnapshot(undefined, uid, current);
  }
}

async function stampLoginTime(uid: string, current: () => boolean) {
  if (!uid) {
    logWarn(
      'AccountStore',
      'stampLoginTime',
      'No uid provided, aborting update',
    );
    return;
  }

  const { doc, updateDoc, getFirestore, serverTimestamp } = await import(
    'firebase/firestore'
  );
  if (!current()) return;
  try {
    await updateDoc(doc(getFirestore(), ACCOUNTS_COLLECTION_NAME, uid), {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    logWarn(
      'AccountStore',
      'stampLoginTime',
      'Error updating lastLogin time',
      error,
    );
  }
}

export function reset() {
  subscription++;
  account.set(null);
  unsubscribe?.();
}
