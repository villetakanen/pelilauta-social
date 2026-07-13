import { persistentAtom } from '@nanostores/persistent';
import { doc, onSnapshot } from 'firebase/firestore';
import { atom } from 'nanostores';
import {
  migrateProfile,
  PROFILES_COLLECTION_NAME,
  type Profile,
  parseProfile,
} from 'src/schemas/ProfileSchema';
import { db } from '../../firebase/client';
import { logDebug, logWarn } from '../../utils/logHelpers';

/**
 * The nanostores atom that holds the current user Profile data.
 */
export const $profile = persistentAtom<Profile | null>(
  'session-profile',
  null,
  {
    encode: JSON.stringify,
    decode: (data) => {
      const object = JSON.parse(data);
      return object;
    },
  },
);
export const $profileMissing = atom(false);
export const profile = $profile;
export const profileMissing = $profileMissing;

let unsubscribe: (() => void) | undefined;

export function subscribeToProfile(uid: string) {
  logDebug('profileStore', 'subscribeToProfile', { uid });

  // Make sure we unsubscribe from any existing subscription first
  if (unsubscribe) {
    logDebug(
      'profileStore',
      'subscribeToProfile',
      'Unsubscribing from existing subscription',
    );
    unsubscribe();
  }

  const profileRef = doc(db, PROFILES_COLLECTION_NAME, uid);
  unsubscribe = onSnapshot(profileRef, (snapshot) => {
    if (snapshot.exists()) {
      try {
        const profileData = parseProfile(snapshot.data(), snapshot.id);
        logDebug('profileStore', 'onSnapshot', 'Profile found', {
          nick: profileData.nick,
        });
        $profile.set(profileData);
        $profileMissing.set(false);
      } catch (error) {
        logWarn(
          'profileStore',
          'onSnapshot',
          'Error parsing profile data, attempting migration',
          error,
        );
        try {
          // Attempt to migrate legacy profile data
          const migratedProfile = migrateProfile(snapshot.data(), snapshot.id);
          logDebug(
            'profileStore',
            'onSnapshot',
            'Profile migrated successfully',
            {
              nick: migratedProfile.nick,
            },
          );
          $profile.set(migratedProfile);
          $profileMissing.set(false);
        } catch (migrationError) {
          logWarn(
            'profileStore',
            'onSnapshot',
            'Failed to migrate profile data',
            migrationError,
          );
          $profileMissing.set(true);
        }
      }
    } else {
      logDebug('profileStore', 'onSnapshot', 'Profile not found');
      $profileMissing.set(true);
    }
  });
}
export function unsubscribeFromProfile() {
  logDebug('profileStore', 'unsubscribeFromProfile', 'Clearing profile data');
  $profile.set(null);
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = undefined;
  }
}
