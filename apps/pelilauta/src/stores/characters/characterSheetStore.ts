import { toFirestoreEntry } from '@utils/client/toFirestoreEntry';
import { t } from '@utils/i18n';
import { atom, effect, type WritableAtom } from 'nanostores';
import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  type CharacterSheet,
  CharacterSheetSchema,
  migrateCharacterSheet,
} from 'src/schemas/CharacterSheetSchema';
import { logDebug, logError } from 'src/utils/logHelpers';

/* ------------------------------------------------------------------------
 *  A Transient Character Sheet Store
 * ------------------------------------------------------------------------
 * A Store used by the Character Sheet Builder components. This store is not intended to be used
 * directly by other parts of the application, or to load and view character sheets outside of the
 * builder.
 *
 * Use CharacterStore for editing and viewing characters, including the sheet data.
 */

/**
 * Current character sheet in the builder.
 *
 * The store contains live version of the sheet being edited in the builder.
 * It is not automatically loaded or saved to the database.
 */
export const characterSheet: WritableAtom<CharacterSheet | null> = atom(null);

/**
 * Indicates if the current sheet has unsaved changes.
 */
export const dirty: WritableAtom<boolean> = atom(false);

// Note: after saving or loading a new sheet to the atom, we have to set dirty to false afterwards.
effect(characterSheet, () => {
  dirty.set(true);
});

/**
 * Loads the character sheet directly from firestore by its key.
 * This will replace the current sheet in the store.
 *
 * @param key the unique key of the character sheet to load
 */
export async function load(key: string) {
  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('@firebase/client');

  const docRef = doc(db, CHARACTER_SHEETS_COLLECTION_NAME, key);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    const newSheet = migrateCharacterSheet({
      ...data,
      key,
    });
    characterSheet.set(newSheet);
    dirty.set(false);
  } else {
    throw new Error(t('errors.characterSheetNotFound', { key }));
  }
}

export async function save() {
  const { doc, setDoc } = await import('firebase/firestore');
  const { db } = await import('@firebase/client');

  const sheet = characterSheet.get();
  if (!sheet) {
    throw new Error(t('errors.noCharacterSheetToSave'));
  }

  if (!sheet.key) {
    throw new Error(t('errors.characterSheetMissingKey'));
  }

  const docRef = doc(db, CHARACTER_SHEETS_COLLECTION_NAME, sheet.key);

  // Update the sheet in the database
  await setDoc(docRef, {
    ...toFirestoreEntry(sheet),
  });
  dirty.set(false);
}

/**
 * Creates a new character sheet in the database
 */
export async function createCharacterSheet(
  sheetData: Partial<CharacterSheet>,
): Promise<string> {
  try {
    const { addDoc, collection } = await import('firebase/firestore');
    const { db } = await import('../../firebase/client');

    // Parse and validate the sheet data
    const characterSheet = CharacterSheetSchema.parse(sheetData);

    logDebug(
      'characterSheetStore',
      'Creating character sheet:',
      characterSheet,
    );

    const docRef = await addDoc(
      collection(db, CHARACTER_SHEETS_COLLECTION_NAME),
      toFirestoreEntry({
        ...characterSheet,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    logDebug(
      'characterSheetStore',
      'Character sheet created successfully:',
      docRef.id,
    );
    return docRef.id;
  } catch (error) {
    logError('characterSheetStore', 'Failed to create character sheet:', error);
    throw error;
  }
}

/*
export const sheet: WritableAtom<CharacterSheet | null> = atom(null);
export const loading: WritableAtom<boolean> = atom(false);

onMount(sheet, () => {
  const key = sheet.get()?.key;
  if (!key) {
    return;
  }
  subscribeCharacterSheet(key);
});

/**
 * Subscribes to a character sheet in the database by its key to populate the store.
 * This function sets up a real-time listener for the character sheet data.
 *
 * @param sheetKey - The unique key of the character sheet to subscribe to.
 * /
export async function subscribeCharacterSheet(sheetKey: string) {
  try {
    const { doc, onSnapshot } = await import('firebase/firestore');
    const { db } = await import('../../firebase/client');

    logDebug(
      'characterSheetStore',
      'Subscribing to character sheet:',
      sheetKey,
    );

    const docRef = doc(db, CHARACTER_SHEETS_COLLECTION_NAME, sheetKey);

    onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const characterSheet = CharacterSheetSchema.parse({
          ...data,
          key: sheetKey,
        });
        logDebug(
          'characterSheetStore',
          'Character sheet updated:',
          characterSheet,
        );
        sheet.set(characterSheet);
      } else {
        logError(
          'characterSheetStore',
          'No character sheet found for key:',
          sheetKey,
        );
        sheet.set(null);
      }
    });
  } catch (error) {
    logError(
      'characterSheetStore',
      'Failed to subscribe to character sheet:',
      error,
    );
    throw error;
  }
}


*/
