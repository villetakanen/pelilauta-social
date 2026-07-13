import { serverAuth, serverDB } from '@firebase/server';
import { ACCOUNTS_COLLECTION_NAME } from '@schemas/AccountSchema';
import { PROFILES_COLLECTION_NAME } from '@schemas/ProfileSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { verifySession } from '@utils/server/auth/verifySession';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    const decodedToken = await verifySession(context);

    if (!decodedToken) {
      return new Response(
        JSON.stringify({
          loggedIn: false,
          eula_accepted: false,
          account_created: false,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const uid = decodedToken.uid;

    const user = await serverAuth.getUser(uid);
    const claims = user.customClaims || {};

    let { eula_accepted = false, account_created = false } = claims;

    // Check for legacy users who have data but no claims set
    if (!eula_accepted || !account_created) {
      logDebug('api/auth/status', `Checking legacy data for user ${uid}`);

      // Check if user has account document (EULA acceptance)
      if (!eula_accepted) {
        const accountDoc = await serverDB
          .collection(ACCOUNTS_COLLECTION_NAME)
          .doc(uid)
          .get();
        if (accountDoc.exists) {
          eula_accepted = true;
          logDebug(
            'api/auth/status',
            `Found existing account document for ${uid}, setting eula_accepted: true`,
          );
        }
      }

      // Check if user has profile document (profile creation)
      if (!account_created) {
        const profileDoc = await serverDB
          .collection(PROFILES_COLLECTION_NAME)
          .doc(uid)
          .get();
        if (profileDoc.exists) {
          account_created = true;
          logDebug(
            'api/auth/status',
            `Found existing profile document for ${uid}, setting account_created: true`,
          );
        }
      }

      // If we found legacy data, update the claims
      if (
        eula_accepted !== claims.eula_accepted ||
        account_created !== claims.account_created
      ) {
        const newClaims = {
          ...claims,
          eula_accepted,
          account_created,
        };
        await serverAuth.setCustomUserClaims(uid, newClaims);
        logDebug(
          'api/auth/status',
          `Updated claims for legacy user ${uid}:`,
          newClaims,
        );
      }
    }

    return new Response(
      JSON.stringify({
        loggedIn: true,
        eula_accepted,
        account_created,
        uid,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    logError('api/auth/status', 'Error fetching user status:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
