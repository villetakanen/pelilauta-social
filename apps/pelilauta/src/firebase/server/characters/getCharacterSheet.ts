import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  type CharacterSheet,
  migrateCharacterSheet,
} from '@schemas/CharacterSheetSchema';
import { toClientEntry } from '@utils/client/entryUtils';
import { logError } from '@utils/logHelpers';
import { ZodError } from 'zod';

export const ERROR_TYPES = [
  'not_found',
  'schema_error',
  'firestore_error',
] as const;
export type CharacterSheetErrorType = (typeof ERROR_TYPES)[number];

export class CharacterSheetError extends Error {
  public type: CharacterSheetErrorType;

  constructor(message: string, type: CharacterSheetErrorType) {
    super(message);
    this.name = 'CharacterSheetError';
    this.type = type;
  }
}

export async function getCharacterSheet(
  key: string | undefined,
): Promise<CharacterSheet> {
  if (!key) {
    throw new CharacterSheetError(
      'Character sheet key is required.',
      'not_found',
    );
  }

  try {
    const { serverDB } = await import('..');

    const docRef = serverDB
      .collection(CHARACTER_SHEETS_COLLECTION_NAME)
      .doc(key);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new CharacterSheetError(
        `Character sheet with key ${key} not found.`,
        'not_found',
      );
    }

    const sheet = migrateCharacterSheet({
      ...toClientEntry(docSnapshot.data() as Record<string, unknown>),
      key,
    });

    return sheet;
  } catch (error) {
    if (error instanceof CharacterSheetError) {
      // Re-throw custom errors to be handled by the caller
      throw error;
    }

    if (error instanceof ZodError) {
      logError(
        'getCharacterSheet:schema',
        `Schema validation failed for character sheet ${key}`,
        error.issues,
      );
      throw new CharacterSheetError(
        `Schema validation failed for character sheet ${key}`,
        'schema_error',
      );
    }

    logError(
      'getCharacterSheet:firestore',
      `Firestore error for character sheet ${key}`,
      error,
    );
    throw new CharacterSheetError(
      `Failed to retrieve character sheet ${key} from Firestore.`,
      'firestore_error',
    );
  }
}
