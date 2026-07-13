import crypto from 'node:crypto';
import {
  CHARACTER_SHEETS_COLLECTION_NAME,
  migrateCharacterSheet,
} from '@schemas/CharacterSheetSchema';
import { toClientEntry } from '@utils/client/entryUtils';
import { logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import type { APIContext } from 'astro';
import type { CollectionReference, Query } from 'firebase-admin/firestore';

export async function GET({ request }: APIContext) {
  const uid = await tokenToUid(request);
  if (!uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const system = searchParams.get('system');

  try {
    const { serverDB } = await import('../../../firebase/server');

    let sheetsQuery: CollectionReference | Query = serverDB.collection(
      CHARACTER_SHEETS_COLLECTION_NAME,
    );

    if (system) {
      sheetsQuery = sheetsQuery.where('system', '==', system);
    }

    const sheetDocs = await sheetsQuery.get();

    const sheets = [];
    for (const sheetDoc of sheetDocs.docs) {
      const sheetData = toClientEntry(sheetDoc.data());
      // Add the document ID as the key if it's missing
      if (!sheetData.key) {
        sheetData.key = sheetDoc.id;
      }
      sheets.push(migrateCharacterSheet(sheetData));
    }

    // Sort by name for consistent ordering
    sheets.sort((a, b) => a.name.localeCompare(b.name));

    const body = JSON.stringify({ sheets });
    const etag = crypto.createHash('sha1').update(body).digest('hex');

    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        ETag: etag,
      },
    });
  } catch (error: unknown) {
    logError('character-sheets API', 'Error fetching character sheets:', error);
    return new Response('Error fetching character sheets', {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
