import { persistentAtom } from '@nanostores/persistent';
import { CharacterSheetSchema } from '@schemas/CharacterSheetSchema';
import { authUser, uid } from '@stores/session';
import { logDebug, logWarn } from '@utils/logHelpers';
import { effect } from 'nanostores';
import { z } from 'zod';

const SheetsSchema = z.array(CharacterSheetSchema);

/**
 * Locally cached list of available character sheets.
 */
export const sheets = persistentAtom<z.infer<typeof SheetsSchema>>(
  'characterSheets',
  [],
  {
    encode: JSON.stringify,
    decode: (data: unknown) => {
      const array = JSON.parse(data as string);
      try {
        return SheetsSchema.parse(array);
      } catch (error) {
        logWarn(
          'sheetsStore',
          'Failed to parse sheets from local storage, proceeding with empty list',
          error,
        );
        return [];
      }
    },
  },
);

async function refreshSheets() {
  try {
    const { authedGet } = await import('@firebase/client/apiClient');
    const response = await authedGet('/api/character-sheets');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    // This is just for safety, the API should always return valid data
    // as it uses the same Zod schema for validation.
    const parsed = SheetsSchema.parse(data.sheets || data);
    // --> Replace local storage with fresh data from the API
    sheets.set(parsed);
    logDebug('sheetsStore', 'Successfully refreshed character sheets', parsed);
  } catch (error) {
    logWarn(
      'sheetsStore',
      'Failed to fetch character sheets from API, continuing with local data',
      error,
    );
  }
}

/**
 * Wait for both uid and authUser to prevent Firebase auth race conditions.
 * Only make authenticated API calls when Firebase is fully initialized.
 */
effect([uid, authUser], ([currentUid, currentAuthUser]) => {
  if (currentUid && currentAuthUser) {
    // Safe to make API calls - Firebase auth is fully initialized
    logDebug('sheetsStore', 'Auth ready, refreshing sheets');
    refreshSheets();
  } else if (!currentUid) {
    // User logged out, clear cached data
    logDebug('sheetsStore', 'User logged out, clearing sheets');
    sheets.set([]);
  }
  // For other states (uid but no authUser), wait - don't make API calls
});
