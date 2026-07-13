import type { APIContext } from 'astro';
import {
  CHARACTERS_COLLECTION_NAME,
  CharacterSchema,
} from 'src/schemas/CharacterSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError, logWarn } from 'src/utils/logHelpers';
import { tokenToUid } from 'src/utils/server/auth/tokenToUid';
import { serverDB } from '../../../firebase/server';

export async function DELETE({
  params,
  request,
}: APIContext): Promise<Response> {
  const endpointName = '/api/characters/[characterKey]';
  const { characterKey } = params;

  if (!characterKey) {
    return new Response('Character key is required', { status: 400 });
  }

  try {
    // Authenticate the user
    const uid = await tokenToUid(request);

    if (!uid) {
      logWarn(endpointName, 'Authentication failed: Invalid or missing token');
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the character document
    const characterRef = serverDB
      .collection(CHARACTERS_COLLECTION_NAME)
      .doc(characterKey);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists) {
      return new Response('Character not found', { status: 404 });
    }

    // Parse the character data
    const characterData = characterDoc.data();
    if (!characterData) {
      return new Response('Invalid character data', { status: 500 });
    }

    // Convert to client entry and validate with schema
    const clientEntry = toClientEntry(characterData);
    const character = CharacterSchema.parse({
      ...clientEntry,
      key: characterKey,
    });

    // Check if the user is authorized to delete this character
    if (!character.owners || !character.owners.includes(uid)) {
      logWarn(
        endpointName,
        `User ${uid} attempted to delete character ${characterKey} without permission`,
      );
      return new Response(
        'Forbidden: You do not have permission to delete this character',
        { status: 403 },
      );
    }

    // Delete the character
    await characterRef.delete();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    logError(endpointName, 'Failed to delete character:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
