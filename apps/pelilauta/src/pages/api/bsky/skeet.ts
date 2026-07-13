// src/pages/api/bsky/post.ts
import type { APIRoute } from 'astro';
import type { FirebaseError } from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { logDebug, logWarn } from 'src/utils/logHelpers';
import { postToBluesky } from 'src/utils/server/bsky/bskyService';
import { serverAuth } from '../../../firebase/server';

export const POST: APIRoute = async ({ request }) => {
  const endpointName = '/api/bsky/post'; // For logging context

  // 1. Get Authorization Header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logWarn(
      endpointName,
      'Auth failed: Missing or invalid Authorization header.',
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing or invalid Authorization header',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 2. Extract Token
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    logWarn(endpointName, 'Auth failed: Token missing after "Bearer ".');
    return new Response(
      JSON.stringify({ success: false, error: 'Missing token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 3. Verify Firebase ID Token
  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await serverAuth.verifyIdToken(idToken);
    // Log success
    logDebug(
      endpointName,
      `Authentication successful for UID: ${decodedToken.uid}`,
      `Email: ${decodedToken.email || 'N/A'}`,
    );

    const articleData = await request.json();

    // Post to Bluesky and capture the URI
    const blueskyUri = await postToBluesky(
      articleData.text,
      articleData.linkUrl,
      articleData.linkTitle,
      articleData.linkDescription,
    );

    if (!blueskyUri) {
      logWarn(endpointName, 'Failed to post to Bluesky');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to post to Bluesky',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Return success response with Bluesky URI
    return new Response(
      JSON.stringify({
        success: true,
        userId: decodedToken.uid,
        blueskyUri,
        message: 'Successfully posted to Bluesky',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    // Log failure
    logWarn(
      endpointName,
      `Authentication failed: Error verifying token. Code: ${(error as FirebaseError).code || 'UNKNOWN'}`,
      `Message: ${(error as FirebaseError).message}`,
    );

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Authentication failed',
        errorCode: (error as FirebaseError).code,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }, // 403 Forbidden is often appropriate for failed token verification
    );
  }
};

// Optional: Handle other methods if needed, otherwise Astro returns 404
// export const GET: APIRoute = ({}) => new Response(null, { status: 405 }); // Method Not Allowed
