import { serverDB } from '@firebase/server';
import { ACCOUNTS_COLLECTION_NAME } from '@schemas/AccountSchema';
import { logError } from '@utils/logHelpers';
import type { APIRoute } from 'astro';

/**
 * Returns the active account UID's for the solution.
 *
 */
export const GET: APIRoute = async function GET() {
  try {
    const query = serverDB
      .collection(ACCOUNTS_COLLECTION_NAME)
      .orderBy('lastLogin', 'desc')
      .limit(14);

    const accounts = await query.get();
    const uids: string[] = [];

    for (const doc of accounts.docs) {
      uids.push(doc.id);
    }

    return new Response(JSON.stringify(uids), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=100',
      },
    });
  } catch (error) {
    logError('api/accounts/active', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
