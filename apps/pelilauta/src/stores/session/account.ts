import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';
import {
  ACCOUNTS_COLLECTION_NAME,
  type Account,
  parseAccount,
} from 'src/schemas/AccountSchema';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { logWarn } from 'src/utils/logHelpers';

// *** Primary session stores: Acccount ******************************************

const LAST_LOGIN_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// The nanostores persisten atom that holds the current user Account data.
export const account = persistentAtom<Account | null>('session-account', null, {
  encode: JSON.stringify,
  decode: (data) => {
    if (!data || data === 'null') return null;
    const object = parseAccount(JSON.parse(data));
    return object;
  },
});
const accountNotFound = atom(false);

// Legacy support for solid components
export const $account = account;

// *** Computed stores *************************************************

// Helper for the EULA acceptance state
export const requiresEula = computed([account, accountNotFound], (acc, anf) => {
  if (anf) return true;
  if (!acc) return false;
  return !acc.eulaAccepted;
});

// Helper for the admin tooling visiblity. The actual authz is done in the
// backend, this is just a helper to show/hide the admin tools in the UI.
export const showAdminTools = computed(
  [account, appMeta], // Uses $account
  (account, appMeta) => {
    if (!account) return false;
    if (!account.uid) return false;
    if (appMeta?.admins?.includes(account.uid)) return true;
    return false;
  },
);

let unsubscribe: () => void;

async function handleAccountSnapshot(
  accountData: Partial<Account> | undefined,
  key: string,
) {
  if (accountData) {
    try {
      const incoming = parseAccount(accountData, key);

      // Lets handle the account update
      account.set(incoming);

      // Check if the lastLogin is within 24 hours, if not we will update it
      const lastLoginTime = incoming.lastLogin?.getTime() || 0;
      if (Date.now() - lastLoginTime > LAST_LOGIN_TIMEOUT) {
        // If the lastLogin is more than 24 hours ago, update it
        await stampLoginTime(incoming.uid);
      }

      accountNotFound.set(false);
    } catch (error) {
      logWarn(
        'AccountStore',
        'handleAccountSnapshot',
        'Error parsing account data',
        error,
      );
      // If we fail to parse the account data, we'LL handle it as not found
      handleAccountSnapshot(undefined, key);
    }
  } else {
    // If the account data is null, we set the account to null and mark it as not found
    account.set(null);
    accountNotFound.set(true);
  }
}

export async function subscribe(uid: string) {
  // Clean up existing subscription first to prevent memory leaks
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = () => {};
  }

  const { doc, onSnapshot, getFirestore } = await import('firebase/firestore');

  try {
    const accountRef = doc(getFirestore(), ACCOUNTS_COLLECTION_NAME, uid);
    unsubscribe = onSnapshot(
      accountRef,
      (snapshot) => handleAccountSnapshot(snapshot.data(), uid),
      (error) => {
        logWarn(
          'AccountStore',
          'subscribe',
          'Error receiving account snapshot',
          error,
        );
        handleAccountSnapshot(undefined, uid);
      },
    );
  } catch (error) {
    logWarn('AccountStore', 'subscribe', 'Error subscribing to account', error);
    handleAccountSnapshot(undefined, uid);
  }
}

async function stampLoginTime(uid: string) {
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
  account.set(null);
  unsubscribe?.();
}
