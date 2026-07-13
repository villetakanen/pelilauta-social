import type { Character } from '@schemas/CharacterSchema';
import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  type CharacterSheet,
  migrateCharacterSheet,
} from '@schemas/CharacterSheetSchema';
import { logDebug, logError } from '@utils/logHelpers';

/**
 * A character with its sheet data resolved.
 */
export type CharacterWithResolvedSheet = Character & {
  sheet?: CharacterSheet;
};

/**
 * Resolves the character sheet for a given character.
 *
 * @param character The character for which to resolve the sheet.
 * @returns A promise that resolves to the character with the sheet data, if found.
 */
export async function resolveCharacterWithSheet(
  character: Character,
): Promise<CharacterWithResolvedSheet> {
  if (!character.sheetKey) {
    logDebug('characterUtils', 'Character has no sheetKey, returning as is.');
    return character;
  }

  try {
    const { db } = await import('@firebase/client');
    const { doc, getDoc } = await import('firebase/firestore');

    const sheetDocRef = doc(
      db,
      CHARACTER_SHEETS_COLLECTION_NAME,
      character.sheetKey,
    );
    const sheetDoc = await getDoc(sheetDocRef);

    if (sheetDoc.exists()) {
      const sheetData = migrateCharacterSheet({
        ...sheetDoc.data(),
        key: sheetDoc.id,
      });
      return { ...character, sheet: sheetData };
    }
    logDebug('characterUtils', 'Sheet not found for key:', character.sheetKey);
    return character;
  } catch (error) {
    logError(
      'characterUtils',
      'Error resolving character sheet:',
      character.sheetKey,
      error,
    );
    return character;
  }
}
