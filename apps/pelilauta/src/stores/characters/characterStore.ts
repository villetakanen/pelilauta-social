/**
 * A store for a character in a game.
 *
 * Subscribes to set character data and provides methods to get and update character information.
 */

import { authedFetch } from '@firebase/client/apiClient';
import {
  CHARACTERS_COLLECTION_NAME,
  type Character,
  CharacterSchema,
} from '@schemas/CharacterSchema';
import {
  type CharacterSheet,
  CharacterSheetSchema,
} from '@schemas/CharacterSheetSchema';
import { toClientEntry } from '@utils/client/entryUtils';
import { pushSnack } from '@utils/client/snackUtils';
import { logDebug } from '@utils/logHelpers';
import { atom, computed, type WritableAtom } from 'nanostores';
import { uid } from '../session';

// The currently loaded character, transient store for reactive updates
// form the firestore subscription. Writable for initial state, and
// updates from the firestore.
//
// For non-initial data: Updating the state should be done using the
// store methods, not by using the atom set method directly.
export const character: WritableAtom<Character | null> = atom(null);

// When the character is loaded, or the sheet key changed, we need to
// fetch the sheet data for UI rendering. This is a separate
// store, as we will not subscribe to sheet changes, only load it once
// when the character changes, the page is refreshed, or the sheet key changes.
export const sheet: WritableAtom<CharacterSheet | null> = atom(null);

export const saving = atom(false);

export const canEdit = computed([character, uid], (c, u) => {
  // Check if the character is editable by the current user
  return c?.owners?.includes(u) ?? false;
});
export const loading = atom(false);
export const sheetLoading = atom(false);

let unsubscribe: CallableFunction = () => {};

/**
 * Subscribe to character data.
 * @param key
 */
export async function subscribe(key: string) {
  logDebug('characterStore', 'Subscribing to character:', key);
  if (character.get()?.key === key) {
    // Already subscribed to this character
    return;
  }
  loading.set(true);
  unsubscribe();

  const { db } = await import('@firebase/client');
  const { onSnapshot, doc } = await import('firebase/firestore');
  const characterDoc = doc(db, CHARACTERS_COLLECTION_NAME, key);

  unsubscribe = onSnapshot(characterDoc, (snapshot) => {
    if (snapshot.exists()) {
      const entry = toClientEntry(snapshot.data());
      const parsedCharacter = CharacterSchema.parse({ ...entry, key });
      character.set(parsedCharacter);

      // Add loading state tracking to prevent concurrent loads
      const currentSheet = sheet.get();
      const isLoadingDifferentSheet =
        currentSheet?.key !== parsedCharacter.sheetKey;

      if (
        parsedCharacter.sheetKey &&
        (!currentSheet || isLoadingDifferentSheet)
      ) {
        loadSheet(parsedCharacter.sheetKey);
      }
    }
    loading.set(false);
  });
}

/**
 * Load character sheet data from API, without real-time updates.
 *
 * Note: the API is cached, so this should be fast, but will not reflect
 * real-time updates to sheets. Sheets are not expected to change often, so this
 * is acceptable.
 *
 * @param sheetKey the Firestore collection document key of the sheet data to load
 */
async function loadSheet(sheetKey: string) {
  if (sheetLoading.get()) return; // Prevent concurrent loads

  logDebug('characterStore', 'Loading character sheet:', sheetKey);
  sheetLoading.set(true);

  try {
    const sheetResponse = await authedFetch(
      `/api/character-sheets/${sheetKey}`,
    );
    if (!sheetResponse.ok) {
      throw new Error(`Failed to load sheet: ${sheetResponse.statusText}`);
    }
    const sheetData = await sheetResponse.json();
    const parsedSheet = CharacterSheetSchema.parse(sheetData);
    sheet.set(parsedSheet);
  } catch (error) {
    logDebug('characterStore', 'Error loading sheet:', error);
    pushSnack('app:error.generic');
  } finally {
    sheetLoading.set(false);
  }
}

export async function update(data: Partial<Character>) {
  logDebug('characterStore', 'Updating character:', data);
  saving.set(true);

  const { updateDoc, doc } = await import('firebase/firestore');
  const { db } = await import('@firebase/client');
  const { toFirestoreEntry } = await import('@utils/client/toFirestoreEntry');

  const currentCharacter = character.get();
  if (!currentCharacter) {
    throw new Error('No character to update');
  }

  // Store original state for potential rollback
  const originalCharacter = { ...currentCharacter };

  // Optimistic update
  const updatedCharacter = { ...currentCharacter, ...data };
  character.set(updatedCharacter);

  try {
    const characterDoc = doc(
      db,
      CHARACTERS_COLLECTION_NAME,
      currentCharacter.key,
    );
    const firestoreData = toFirestoreEntry(updatedCharacter);

    // Load new sheet if the sheet key changed
    if (data.sheetKey && data.sheetKey !== currentCharacter.sheetKey) {
      loadSheet(data.sheetKey);
    }

    await updateDoc(characterDoc, firestoreData);
    logDebug(
      'characterStore',
      'Character updated successfully:',
      currentCharacter.key,
    );
  } catch (error) {
    // Rollback optimistic update on failure
    character.set(originalCharacter);
    logDebug('characterStore', 'Character update failed, rolling back:', error);
    pushSnack('app:error.generic');
    throw error;
  } finally {
    saving.set(false);
  }
}

/**
 * Clean up the character store subscriptions and reset all state.
 * Should be called when component is unmounted or when switching characters.
 */
export function cleanup() {
  logDebug('characterStore', 'Cleaning up character subscription');
  unsubscribe();
  character.set(null);
  sheet.set(null);
  loading.set(false);
  sheetLoading.set(false);
}

/**
 * Manually refresh the current character sheet data.
 * Useful when sheet templates have been updated and need to be reloaded.
 */
export async function refreshSheet() {
  const currentCharacter = character.get();
  if (currentCharacter?.sheetKey) {
    sheet.set(null); // Clear current sheet
    await loadSheet(currentCharacter.sheetKey);
  }
}

/**
 * Update a single stat value in the character's stats object.
 *
 * @param statKey the key of the stat to update
 * @param value the new value for the stat
 */
export async function updateStat(statKey: string, value: number) {
  const currentCharacter = character.get();
  if (!currentCharacter) {
    throw new Error('No character to update');
  }

  // Check if the stat has a type in the sheet, if so, validate the value
  // before updating.
  //
  // If the there is no sheet, or the stat is not defined in the sheet,
  // we skip validation and update the value as given.
  const currentSheet = sheet.get();
  const statDefinition = currentSheet?.stats?.find((s) => s.key === statKey);
  if (statDefinition) {
    if (statDefinition.type === 'number') {
      if (Number.isNaN(value)) {
        throw new Error(`Invalid value for stat ${statKey}: ${value}`);
      }
    }
  }

  // Update the stat in the character's stats object
  const updatedStats = {
    ...currentCharacter.stats,
    [statKey]: value,
  };

  // Call the update function to persist the change
  await update({ stats: updatedStats });
}
