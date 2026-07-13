import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';
import { PROFILES_COLLECTION_NAME } from 'src/schemas/ProfileSchema';
import { t } from 'src/utils/i18n';
import { logError, logWarn } from 'src/utils/logHelpers';
import { toFid } from 'src/utils/toFid';
import { z } from 'zod';

export const PublicProfileSchema = z.object({
  key: z.string(),
  nick: z.string(),
  avatarURL: z.string().optional(),
  username: z.string(),
});

export type PublicProfile = z.infer<typeof PublicProfileSchema>;

/**
 * Store for public profiles
 *
 * This store is used to store public profiles of users, instead of directly using the store
 * as a reactive store, we use it in createEffect, so we may update a profile to existing when it
 * is fetched from the server.
 */
export const profiles = persistentAtom<Record<string, PublicProfile>>(
  'profiles',
  {},
  {
    encode: JSON.stringify,
    decode: (data) => {
      const object = JSON.parse(data);
      return object;
    },
  },
);

export const loading = atom<string[]>([]);

/**
 * Returns a reactive store for a public profile. The store will automatically
 * fetch the profile from the server if it is not available in the store.
 *
 * While the profile is being fetched, the store will return `undefined`. If a profile
 * is not found, it will return an anonymous profile with the given `uid`.
 *
 * @param uid a Firebase UID of the user whose profile is being fetched
 * @returns a reactive store containing the public profile of the user
 * @throws Error if `uid` is undefined
 */
export function getProfileAtom(uid: string) {
  if (!uid)
    throw new Error('getProfileAtom called with undefined uid, aborting');

  // Only fetch if profile doesn't exist and isn't already loading
  if (!profiles.get()[uid] && !loading.get().includes(uid)) {
    fetchProfile(uid);
  }

  return computed(profiles, (profiles) => {
    const profile = profiles[uid];
    if (profile) {
      return profile;
    }
    if (loading.get().includes(uid)) {
      // If profile is loading, return undefined
      return undefined;
    }
    // If profile is not found, return an anonymous profile
    return createEmptyPublicProfile(uid);
  });
}

async function fetchProfile(key: string) {
  if (loading.get().includes(key)) {
    return;
  }
  loading.set([...loading.get(), key]);

  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../../firebase/client');

    const publicProfileDoc = await getDoc(doc(db, 'profiles', key));

    if (publicProfileDoc.exists()) {
      const publicProfile = normalizeProfileData(publicProfileDoc.data(), key);

      profiles.set({
        ...profiles.get(),
        [key]: publicProfile,
      });
    } else {
      const anon = createEmptyPublicProfile(key);
      profiles.set({
        ...profiles.get(),
        [key]: anon,
      });
    }
  } catch (error) {
    logError('profilesStore', 'fetchProfile', key, error);
    // Set anonymous profile on error
    const anon = createEmptyPublicProfile(key);
    profiles.set({
      ...profiles.get(),
      [key]: anon,
    });
  } finally {
    // Always remove from loading state
    loading.set(loading.get().filter((k) => k !== key));
  }
}
/**
 * Directly fetch the profile entry from the cache, or
 * fetch it from the server if it is not available.
 *
 * Do note, we do not respect the loading state here, so this function
 * should be deprecated in favor of `getProfileAtom` which provides a
 * reactive store for the profile.
 *
 * @param key the uid of the profile
 * @deprecated This function is deprecated, use `getProfileAtom` instead.
 */
export async function fetchProfileEntry(key: string): Promise<PublicProfile> {
  const profile = profiles.get()[key];
  if (profile) {
    return profile;
  }

  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../../firebase/client');

    const publicProfileDoc = await getDoc(doc(db, 'profiles', key));

    if (publicProfileDoc.exists()) {
      const profile = normalizeProfileData(publicProfileDoc.data(), key);
      profiles.set({
        ...profiles.get(),
        [key]: profile,
      });
      return profile;
    }

    const anon = createEmptyPublicProfile(key);
    profiles.set({
      ...profiles.get(),
      [key]: anon,
    });
    return anon;
  } catch (error) {
    logError('profilesStore', 'fetchProfileEntry', key, error);
    const anon = createEmptyPublicProfile(key);
    profiles.set({
      ...profiles.get(),
      [key]: anon,
    });
    return anon;
  }
}

function createEmptyPublicProfile(key: string): PublicProfile {
  return {
    key,
    nick: t('app:meta.anonymous'),
    username: t('app:meta.anonymous'),
  };
}

export async function fetchAllProfiles() {
  logWarn('Fetching all active profiles');

  try {
    const { db } = await import('../../firebase/client');
    const { getDocs, collection, query } = await import('firebase/firestore');

    const q = query(
      collection(db, PROFILES_COLLECTION_NAME),
      // where('frozen', '==', false)
    );

    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const profile = normalizeProfileData(doc.data(), doc.id);
      profiles.set({
        ...profiles.get(),
        [doc.id]: profile,
      });
    }
  } catch (error) {
    logError(
      'profilesStore',
      'fetchAllProfiles',
      'Failed to fetch all profiles:',
      error,
    );
  }
}

export function normalizeProfileData(
  data: unknown,
  key: string,
): PublicProfile {
  const typecCastedData = data as Partial<PublicProfile> & {
    photoURL: string;
    nick: string;
  };
  return PublicProfileSchema.parse({
    ...typecCastedData,
    key,
    avatarURL: typecCastedData.avatarURL || typecCastedData.photoURL || '',
    username: typecCastedData.username || toFid(typecCastedData.nick),
  });
}
