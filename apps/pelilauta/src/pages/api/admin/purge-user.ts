import { serverAuth, serverDB } from '@firebase/server';
import { ACCOUNTS_COLLECTION_NAME } from '@schemas/AccountSchema';
import { AppMetaSchema } from '@schemas/AppMetaSchema';
import { PROFILES_COLLECTION_NAME } from '@schemas/ProfileSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import type { APIRoute } from 'astro';

/**
 * Structural check for a firebase-admin error code, without importing a
 * Firebase SDK into this server route.
 *
 * This previously tested `error instanceof FirebaseError` against the *client*
 * SDK's class. `serverAuth` throws firebase-admin's own `FirebaseError`, a
 * different class, so that test was always false and the not-found branch below
 * was unreachable. Admin errors expose `code` as `auth/user-not-found`, which is
 * what this matches.
 */
function hasErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    (error as Error & { code?: unknown }).code === code
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const adminUid = await tokenToUid(request);
    if (!adminUid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const appMetaDoc = await serverDB.collection('meta').doc('pelilauta').get();
    if (!appMetaDoc.exists) {
      return new Response('App metadata not found', { status: 500 });
    }
    const appMeta = AppMetaSchema.parse(appMetaDoc.data());

    if (!appMeta.admins.includes(adminUid)) {
      return new Response('Forbidden', { status: 403 });
    }

    const { uid: userToPurgeUid } = await request.json();
    if (!userToPurgeUid) {
      return new Response('Missing user UID', { status: 400 });
    }

    logDebug(
      'api/admin/purge-user',
      `Purging user ${userToPurgeUid} by admin ${adminUid}`,
    );

    // 1. Clear custom claims
    try {
      await serverAuth.getUser(userToPurgeUid);
      await serverAuth.setCustomUserClaims(userToPurgeUid, {});
      logDebug(
        'api/admin/purge-user',
        `Cleared custom claims for ${userToPurgeUid}`,
      );
    } catch (error: unknown) {
      if (hasErrorCode(error, 'auth/user-not-found')) {
        logDebug(
          'api/admin/purge-user',
          `User ${userToPurgeUid} not found in Auth, skipping claim removal.`,
        );
      } else {
        throw error; // Re-throw other errors
      }
    }

    // 2. Delete account document
    const accountRef = serverDB
      .collection(ACCOUNTS_COLLECTION_NAME)
      .doc(userToPurgeUid);
    await accountRef.delete();
    logDebug(
      'api/admin/purge-user',
      `Deleted account document for ${userToPurgeUid}`,
    );

    // 3. Delete profile document
    const profileRef = serverDB
      .collection(PROFILES_COLLECTION_NAME)
      .doc(userToPurgeUid);
    await profileRef.delete();
    logDebug(
      'api/admin/purge-user',
      `Deleted profile document for ${userToPurgeUid}`,
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('api/admin/purge-user', 'Error purging user:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
