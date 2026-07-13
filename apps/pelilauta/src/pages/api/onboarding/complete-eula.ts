import { serverAuth, serverDB } from '@firebase/server';
import { ACCOUNTS_COLLECTION_NAME } from '@schemas/AccountSchema';
import { logDebug, logError } from '@utils/logHelpers';
import { tokenToUid } from '@utils/server/auth/tokenToUid';
import { toFid } from '@utils/toFid';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const uid = await tokenToUid(request);
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { nick, avatarURL } = body;

    if (!nick || typeof nick !== 'string') {
      return new Response('Nickname is required', { status: 400 });
    }

    // Validate nickname isn't already taken
    const username = toFid(nick);

    // Check if any profile already has this username (we need to query by username)
    const profilesCollection = serverDB.collection('profiles');
    const usernameQuery = await profilesCollection
      .where('username', '==', username)
      .get();

    if (!usernameQuery.empty) {
      // Check if the found profile belongs to the current user
      const existingDoc = usernameQuery.docs[0];
      if (existingDoc.id !== uid) {
        return new Response('Nickname is already taken', { status: 409 });
      }
      // If it matches uid, we allow overwriting (repair scenario)
    }

    const batch = serverDB.batch();

    // Create account document
    const accountRef = serverDB.collection(ACCOUNTS_COLLECTION_NAME).doc(uid);
    batch.set(accountRef, {
      uid,
      eulaAccepted: true,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: 'fi',
      frozen: false,
    });

    // Create profile document with uid as document ID
    const profileRef = serverDB.collection('profiles').doc(uid);
    batch.set(profileRef, {
      key: uid,
      username,
      nick,
      avatarURL: avatarURL || '',
      bio: '',
      tags: [],
      lovedThreads: [],
    });

    // Set custom claims
    await serverAuth.setCustomUserClaims(uid, {
      eula_accepted: true,
      account_created: true,
    });

    // Execute batch write
    await batch.commit();

    logDebug(
      'api/onboarding/complete-eula',
      `Created account and profile for ${uid} with nick: ${nick}`,
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logError('api/onboarding/complete-eula', 'Error completing EULA:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
