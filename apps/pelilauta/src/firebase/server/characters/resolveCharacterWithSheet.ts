import type { Character } from '@schemas/CharacterSchema';
import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  type CharacterSheet,
  migrateCharacterSheet,
} from '@schemas/CharacterSheetSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { serverDB } from '..';

export type CharacterWithResolvedSheet = Character & {
  sheet?: CharacterSheet;
};

export async function resolveCharacterWithSheet(
  character: Character,
): Promise<CharacterWithResolvedSheet> {
  if (!character.sheetKey) {
    logDebug(
      'resolveCharacterWithSheet',
      'Character has no sheetKey, returning as is.',
    );
    return character;
  }

  try {
    const sheetDocRef = serverDB
      .collection(CHARACTER_SHEETS_COLLECTION_NAME)
      .doc(character.sheetKey);
    const sheetDoc = await sheetDocRef.get();

    if (sheetDoc.exists) {
      const sheetData = migrateCharacterSheet({
        ...sheetDoc.data(),
        key: sheetDoc.id,
      });
      return { ...character, sheet: sheetData };
    }
    logDebug(
      'resolveCharacterWithSheet',
      'Sheet not found for key:',
      character.sheetKey,
    );
    return character;
  } catch (error) {
    logError(
      'resolveCharacterWithSheet',
      'Error resolving character sheet:',
      character.sheetKey,
      error,
    );
    return character;
  }
}
