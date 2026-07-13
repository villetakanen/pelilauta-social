import type { APIContext } from 'astro';
import {
  CHARACTERS_COLLECTION_NAME,
  type Character,
  CharacterSchema,
} from 'src/schemas/CharacterSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError, logWarn } from 'src/utils/logHelpers';
import { serverDB } from '../../../../firebase/server';

export async function GET({ params }: APIContext): Promise<Response> {
  const { siteKey } = params;

  if (!siteKey) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    // Query characters that belong to this site
    const characterDocs = await serverDB
      .collection(CHARACTERS_COLLECTION_NAME)
      .where('siteKey', '==', siteKey)
      .get();

    const characters: Array<Character> = [];

    for (const characterDoc of characterDocs.docs) {
      try {
        // Parse character data using Zod schema
        const characterData = CharacterSchema.parse({
          ...toClientEntry(characterDoc.data()),
          key: characterDoc.id,
        });
        characters.push(characterData);
      } catch (parseError) {
        // Skip invalid character data
        logWarn(`Failed to parse character ${characterDoc.id}:`, parseError);
      }
    }

    return new Response(JSON.stringify(characters), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    logError('Error fetching characters:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
