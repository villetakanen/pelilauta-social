import { logError } from './logHelpers';

/**
 * Converts AT Protocol URI to web URL
 * @param uri - AT Protocol URI (e.g., at://did:plc:xxx/app.bsky.feed.post/yyy)
 * @param handle - User's Bluesky handle (e.g., pelilauta.social)
 * @returns Web URL (e.g., https://bsky.app/profile/pelilauta.social/post/yyy)
 */
export function atUriToWebUrl(uri: string, _handle: string): string | null {
  try {
    // URI format: at://did:plc:xxx/app.bsky.feed.post/rkey
    const match = uri.match(/at:\/\/[^/]+\/app\.bsky\.feed\.post\/(.+)$/);
    if (!match) {
      logError('atUriToWebUrl', 'Invalid AT Protocol URI format:', uri);
      return null;
    }

    const rkey = match[1];
    return `https://bsky.app/profile/pelilauta.bsky.social/post/${rkey}`;
  } catch (error) {
    logError('atUriToWebUrl', 'Failed to convert URI:', error);
    return null;
  }
}
