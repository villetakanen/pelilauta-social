import { persistentAtom } from '@nanostores/persistent';
import { atom, effect, type WritableAtom } from 'nanostores';
import { type Character, CharacterSchema } from 'src/schemas/CharacterSchema';
import { logDebug, logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { authUser, uid } from '../session';

/**
 * A nanostore for caching the user's characters.
 */
export const userCharacters: WritableAtom<Character[]> = persistentAtom(
  'user-character-cache',
  [],
  {
    encode: JSON.stringify,
    decode: (data) => {
      try {
        const parsed = JSON.parse(data);
        const validationResult = z.array(CharacterSchema).safeParse(parsed);
        if (validationResult.success) {
          return validationResult.data;
        }
        logError(
          'userCharacters:decode',
          'Invalid data in localStorage',
          validationResult.error,
        );
        return [];
      } catch (error) {
        logError(
          'userCharacters:decode',
          'Failed to parse data from localStorage',
          error,
        );
        return [];
      }
    },
  },
);

/**
 * Loading state for the characters
 */
export const userCharactersLoading = atom<boolean>(false);

/**
 * Fetch characters from API and replace local cache if successful
 */
async function fetchAndReplaceCharacters(currentUid: string) {
  // Double-check that we still have a uid and Firebase auth user before making API call
  if (!currentUid || !authUser.get()) {
    logDebug(
      'userCharacters',
      'Firebase auth not ready when trying to fetch characters, skipping',
    );
    return;
  }

  userCharactersLoading.set(true);

  try {
    logDebug(
      'userCharacters',
      `Fetching characters for ${currentUid} from API`,
    );

    // Use authedFetch helper instead of manual token handling
    const { authedGet } = await import('../../firebase/client/apiClient');
    const response = await authedGet('/api/characters');

    if (!response.ok) {
      logError('userCharacters', `API request failed: ${response.status}`);
      // If unauthorized, it might be a temporary auth issue, don't clear cache
      if (response.status === 401) {
        logError(
          'userCharacters',
          'Unauthorized API call - possible auth race condition',
        );
      }
      return;
    }

    const data = await response.json();
    const validationResult = z.array(CharacterSchema).safeParse(data);

    if (validationResult.success) {
      // Replace local cache with fresh data
      userCharacters.set(validationResult.data);
      logDebug(
        'userCharacters',
        `Replaced cache with ${validationResult.data.length} characters from API`,
      );
    } else {
      logError(
        'userCharacters',
        'Invalid characters data from API',
        validationResult.error,
      );
    }
  } catch (error) {
    logError('userCharacters', 'Failed to fetch characters from API:', error);
    // Check if it's an auth error
    if (
      error instanceof Error &&
      error.message.includes('User not authenticated')
    ) {
      logError(
        'userCharacters',
        'Auth error during fetch - this indicates a race condition was caught',
      );
    }
  } finally {
    userCharactersLoading.set(false);
  }
}

/**
 * React to authentication state changes
 * Wait for both uid and Firebase authUser to be available before making API calls
 * This prevents race conditions where uid is available from localStorage
 * but Firebase auth hasn't finished initializing yet
 */
effect([uid, authUser], ([currentUid, currentAuthUser]) => {
  logDebug('userCharacters:effect', 'State change', {
    uid: currentUid,
    authUserReady: !!currentAuthUser,
  });

  if (currentUid && currentAuthUser) {
    // User logged in and Firebase auth is ready, safe to fetch characters
    fetchAndReplaceCharacters(currentUid);
  } else if (!currentUid) {
    // User logged out, clear characters
    userCharacters.set([]);
    userCharactersLoading.set(false);
  }
  // For other states (uid but no authUser yet), we wait and don't make API calls
  // This prevents the race condition where uid is restored from localStorage
  // before Firebase auth has finished initializing and set currentUser
});
