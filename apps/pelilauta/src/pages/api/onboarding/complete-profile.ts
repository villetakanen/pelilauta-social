import { serverAuth, serverDB } from '@firebase/server';
import { logDebug, logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const uid = await tokenToUid(request);
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const profileData = await request.json();

    // Update profile document in Firestore
    const profileRef = serverDB.collection('profiles').doc(uid);
    await profileRef.set(profileData, { merge: true });
    logDebug('api/onboarding/complete-profile', `Updated profile for ${uid}`);

    // Update custom claims
    const user = await serverAuth.getUser(uid);
    const claims = user.customClaims || {};
    await serverAuth.setCustomUserClaims(uid, {
      ...claims,
      account_created: true,
    });
    logDebug(
      'api/onboarding/complete-profile',
      `Set account_created claim for ${uid}`,
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError(
      'api/onboarding/complete-profile',
      'Error completing profile:',
      error,
    );
    return new Response('Internal Server Error', { status: 500 });
  }
};
