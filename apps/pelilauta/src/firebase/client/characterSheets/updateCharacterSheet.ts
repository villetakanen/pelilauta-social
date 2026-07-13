import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  type CharacterSheet,
} from 'src/schemas/CharacterSheetSchema';

/**
 * A helper function to update a character sheet document in Firestore.
 *
 * This function performs the following operations:
 * 1. Updates the character sheet document with the provided changes, with merge strategy.
 *
 * @param sheetData A partial object containing the character sheet data to update. The object must contain at least a `key` field.
 */
export async function updateCharacterSheet(sheetData: Partial<CharacterSheet>) {
  // The SheetData is a partial object, so we need to ensure that it has at least
  // A Key field present - as it's required by the Firestore document structure.

  if (!sheetData.key) {
    throw new Error('updateCharacterSheet: Sheet data must contain a key');
  }

  const { doc, setDoc } = await import('firebase/firestore');
  const { convertDatesToTimestamps } = await import(
    'src/utils/client/toFirestoreEntry'
  );
  const { db } = await import('..');

  // First we need to make sure that any Dates in the sheetData are converted to
  // Firestore timestamps.
  const data = convertDatesToTimestamps(sheetData);

  const sheetRef = doc(db, CHARACTER_SHEETS_COLLECTION_NAME, data.key);

  return await setDoc(sheetRef, data, { merge: true });
}
