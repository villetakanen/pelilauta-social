import crypto from 'node:crypto';
import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  CharacterSheetSchema,
  migrateCharacterSheet,
} from '@schemas/CharacterSheetSchema';
import { toClientEntry } from '@utils/client/entryUtils';
import { logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import type { APIContext } from 'astro';

export async function GET({ request, params }: APIContext) {
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { sheetKey } = params;
  if (
    !sheetKey ||
    typeof sheetKey !== 'string' ||
    sheetKey.trim().length === 0
  ) {
    return new Response(
      JSON.stringify({ error: 'Valid sheet key is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const { serverDB } = await import('@firebase/server');

    const sheetRef = serverDB
      .collection(CHARACTER_SHEETS_COLLECTION_NAME)
      .doc(sheetKey);

    const sheetDoc = await sheetRef.get();

    if (!sheetDoc.exists || !sheetDoc.data()) {
      return new Response(
        JSON.stringify({ error: 'Character sheet not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const sheet = CharacterSheetSchema.parse(
      toClientEntry(
        migrateCharacterSheet({ ...sheetDoc.data(), key: sheetDoc.id }),
      ),
    );

    const body = JSON.stringify(sheet);
    const etag = crypto.createHash('sha1').update(body).digest('hex');

    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=600, stale-while-revalidate=3600',
        ETag: etag,
      },
    });
  } catch (error: unknown) {
    logError('character-sheets API', 'Error fetching character sheet:', error);
    return new Response(
      JSON.stringify({ error: 'Error fetching character sheet' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
