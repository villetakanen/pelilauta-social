// src/lib/server/blueskyService.ts
import { AtpAgent, RichText } from '@atproto/api';
import { logDebug, logError, logWarn } from 'src/utils/logHelpers';

const BSKY_SERVICE_URL = 'https://bsky.social';

const agent = new AtpAgent({
  service: BSKY_SERVICE_URL,
});
logDebug('AtpAgent initialized for service:', BSKY_SERVICE_URL); // Updated log message slightly

async function getAuthenticatedAgent(): Promise<AtpAgent> {
  if (agent.hasSession) {
    logDebug('Bluesky agent already has session.');
    return agent;
  }

  logDebug('Attempting Bluesky login...');
  const identifier =
    process.env.SECRET_bsky_handle ?? import.meta.env.SECRET_bsky_handle;
  const password =
    process.env.SECRET_bsky_password ?? import.meta.env.SECRET_bsky_password;

  logDebug('Bluesky login attempt for handle:', identifier);

  if (!identifier || !password) {
    logError(
      'Bluesky login failed: Credentials missing in environment variables (SECRET_bsky_handle or SECRET_bsky_password).',
    );
    throw new Error('Bluesky credentials missing.');
  }

  try {
    // Login method is the same
    await agent.login({ identifier, password });
    logDebug(`Bluesky login successful for handle: ${identifier}`);
    return agent;
  } catch (error: unknown) {
    const e = error as { message?: string };
    logError('Bluesky login failed:', e.message || error);
    throw new Error(`Bluesky login failed: ${e.message || 'Unknown error'}`);
  }
}

export async function postToBluesky(
  text: string,
  linkUrl?: string,
  linkTitle?: string,
  linkDescription?: string,
): Promise<string | null> {
  try {
    const authenticatedAgent = await getAuthenticatedAgent(); // Gets the AtpAgent

    const rt = new RichText({ text });
    // detectFacets works with AtpAgent
    await rt.detectFacets(authenticatedAgent);

    let embed: Record<string, unknown> | undefined;
    if (linkUrl) {
      logDebug('Attempting to create Bluesky link card for:', linkUrl);
      try {
        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: linkUrl,
            title: linkTitle || '',
            description: linkDescription || '',
          },
        };
        logDebug('Link card embed prepared for:', linkUrl);
      } catch (fetchError: unknown) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);
        logWarn(
          `Could not prepare link card embed object for ${linkUrl}:`,
          errorMessage,
        );
        embed = undefined;
      }
    }

    const postRecord: Record<string, unknown> = {
      $type: 'app.bsky.feed.post' as const, // Ensure literal type
      text: rt.text,
      facets: rt.facets,
      embed: embed,
      // createdAt: new Date().toISOString(), // Let the agent handle createdAt
    };

    logDebug('Posting to Bluesky:', {
      text: postRecord.text,
      hasEmbed: !!postRecord.embed,
    });

    if (!postRecord || !postRecord.text) {
      logError('Post record is undefined or empty. Cannot post to Bluesky.');
      return null;
    }
    // post method is the same
    const response = await authenticatedAgent.post(postRecord);
    logDebug('Successfully posted to Bluesky. URI:', response.uri);
    return response.uri;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Failed to post to Bluesky:', errorMessage);
    // Attempt to access Bluesky-specific error properties more safely
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'error' in error &&
      'message' in error
    ) {
      logError(
        `Bluesky API Error Status: ${error.status}, Code: ${error.error}, Message: ${error.message}`,
      );
    }
    return null;
  }
}
