import {
  CHARACTERS_COLLECTION_NAME,
  type Character,
  CharacterSchema,
} from 'src/schemas/CharacterSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError } from 'src/utils/logHelpers';
import { ZodError } from 'zod';

export const ERROR_TYPES = [
  'not_found',
  'schema_error',
  'firestore_error',
] as const;
export type CharacterErrorType = (typeof ERROR_TYPES)[number];

export class CharacterError extends Error {
  public type: CharacterErrorType;

  constructor(message: string, type: CharacterErrorType) {
    super(message);
    this.name = 'CharacterError';
    this.type = type;
  }
}

export async function getCharacter(
  key: string | undefined,
): Promise<Character> {
  if (!key) {
    throw new CharacterError('Character key is required.', 'not_found');
  }

  try {
    const { serverDB } = await import('..');

    const docRef = serverDB.collection(CHARACTERS_COLLECTION_NAME).doc(key);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new CharacterError(
        `Character with key ${key} not found.`,
        'not_found',
      );
    }

    const character = CharacterSchema.parse({
      ...toClientEntry(docSnapshot.data() as Record<string, unknown>),
      key,
    });

    return character;
  } catch (error) {
    if (error instanceof CharacterError) {
      // Re-throw custom errors to be handled by the caller
      throw error;
    }

    if (error instanceof ZodError) {
      logError(
        'getCharacter:schema',
        `Schema validation failed for character ${key}`,
        error.issues,
      );
      throw new CharacterError(
        `Schema validation failed for character ${key}`,
        'schema_error',
      );
    }

    logError(
      'getCharacter:firestore',
      `Firestore error for character ${key}`,
      error,
    );
    throw new CharacterError(
      `Failed to retrieve character ${key} from Firestore.`,
      'firestore_error',
    );
  }
}
