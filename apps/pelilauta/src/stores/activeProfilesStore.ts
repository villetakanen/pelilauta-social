import { persistentAtom } from '@nanostores/persistent';
import { ACCOUNTS_COLLECTION_NAME } from 'src/schemas/AccountSchema';
import {
  PROFILES_COLLECTION_NAME,
  type Profile,
  parseProfile,
} from 'src/schemas/ProfileSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';

export const activeProfiles = persistentAtom<Profile[]>('active-profiles', [], {
  encode: JSON.stringify,
  decode: (data) => {
    const object = JSON.parse(data);
    return object;
  },
});

function profileCached(uid: string) {
  return activeProfiles.get().find((p) => p.key === uid);
}

function patchProfile(profile: Profile) {
  const profiles = [...activeProfiles.get()];
  const index = profiles.findIndex((p) => p.key === profile.key);
  if (index !== -1) {
    profiles[index] = profile;
    activeProfiles.set(profiles);
    return;
  }
  activeProfiles.set([...profiles, profile]);
}

/**
 * Fetches all active accounts, and their respective profiles.
 *
 * Profiles are stored in the local-store, and not re-fetched if they already exist.
 */
export async function fetchActiveProfiles() {
  const { getFirestore, collection, query, getDocs, where, doc, getDoc } =
    await import('firebase/firestore');

  // Date.now() - 15 days
  const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;

  const q = query(
    collection(getFirestore(), ACCOUNTS_COLLECTION_NAME),
    where('lastLogin', '>', new Date(fifteenDaysAgo)),
  );
  const activeAccounts = await getDocs(q);

  for (const accountDoc of activeAccounts.docs) {
    if (accountDoc?.data()?.frozen) {
      continue;
    }
    const uid = accountDoc.id;

    // check if profiles store already has the profile
    if (!profileCached(uid)) {
      const profileRef = doc(getFirestore(), PROFILES_COLLECTION_NAME, uid);
      const profileDoc = await getDoc(profileRef);
      if (!profileDoc.exists()) {
        console.error(`Profile not found for account: ${uid}`);
        continue;
      }
      const profile = parseProfile(toClientEntry(profileDoc.data()), uid);
      patchProfile(profile);
    }
  }
}
