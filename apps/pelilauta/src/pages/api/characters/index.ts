import crypto from 'node:crypto';
import { serverDB } from '@firebase/server';
import {
  CHARACTERS_COLLECTION_NAME,
  type Character,
  CharacterSchema,
} from '@schemas/CharacterSchema';
import { toClientEntry } from '@utils/client/entryUtils';
import { logDebug, logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Authenticate the user
    const uid = await tokenToUid(request);
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Query characters owned by the authenticated user
    const charactersQuery = serverDB
      .collection(CHARACTERS_COLLECTION_NAME)
      .where('owners', 'array-contains', uid);

    const querySnapshot = await charactersQuery.get();
    const characters: Character[] = [];

    for (const doc of querySnapshot.docs) {
      try {
        const characterData = CharacterSchema.parse({
          ...toClientEntry(doc.data()),
          key: doc.id,
        });
        characters.push(characterData);
      } catch (parseError) {
        logError(
          'api/characters:GET',
          `Failed to parse character ${doc.id}:`,
          parseError,
        );
        // Skip invalid characters rather than failing the entire request
      }
    }

    // Sort characters by creation date (newest first)
    characters.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });

    const body = JSON.stringify(characters);
    const etag = crypto.createHash('sha256').update(body).digest('hex');

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=300',
        ETag: etag,
      },
    });
  } catch (error) {
    logError('api/characters:GET', 'Failed to fetch user characters:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate the user
    const uid = await tokenToUid(request);
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const characterData = CharacterSchema.partial().parse(body);

    // Ensure the current user is in the owners array
    const data: Partial<Character> = {
      ...characterData,
      owners: [uid], // Override to ensure current user owns the character
    };

    // Create the Firestore entry with server-side timestamps
    const firestoreData = {
      ...data,
      author: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      flowTime: FieldValue.serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await serverDB
      .collection(CHARACTERS_COLLECTION_NAME)
      .add(firestoreData);

    logDebug('api/characters', 'Character created successfully:', docRef.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: docRef.id,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    logError('api/characters', 'Failed to create character:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid character data',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};
