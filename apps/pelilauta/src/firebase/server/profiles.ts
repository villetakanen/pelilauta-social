import {
  PROFILES_COLLECTION_NAME,
  type Profile,
  type PublicProfile,
  PublicProfileSchema,
  parseProfile,
} from 'src/schemas/ProfileSchema';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { logError } from 'src/utils/logHelpers';
import { toFid } from 'src/utils/toFid';

/**
 * Reads one profile's full record.
 *
 * @param uid the Firebase UID of the profile
 * @returns the parsed `Profile`, or `null` if it does not exist or the read fails
 */
export async function getProfileData(uid: string): Promise<Profile | null> {
  try {
    const { serverDB } = await import('./index.js');
    const profileDoc = await serverDB
      .collection(PROFILES_COLLECTION_NAME)
      .doc(uid)
      .get();

    const data = profileDoc.data();

    if (!profileDoc.exists || !data) {
      return null;
    }

    return parseProfile(toClientEntry(data), uid);
  } catch (error) {
    logError('getProfileData', 'Failed to fetch profile:', error);
    return null;
  }
}

/**
 * Reads public attribution for a batch of profiles in one Firestore call.
 *
 * Uids are deduped before the read. An unresolvable uid (missing document, or
 * one that fails the public schema) is omitted from the result rather than
 * throwing. Empty input returns an empty map without touching Firestore.
 *
 * @param uids the Firebase UIDs to resolve
 * @returns public profiles keyed by uid, for only the uids that resolved
 */
export async function getPublicProfiles(
  uids: string[],
): Promise<Record<string, PublicProfile>> {
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));

  const result: Record<string, PublicProfile> = {};

  if (uniqueUids.length === 0) {
    return result;
  }

  try {
    const { serverDB } = await import('./index.js');
    const refs = uniqueUids.map((uid) =>
      serverDB.collection(PROFILES_COLLECTION_NAME).doc(uid),
    );
    const docs = await serverDB.getAll(...refs);

    for (const doc of docs) {
      const data = doc.data();

      if (!doc.exists || !data) {
        continue;
      }

      const nick = typeof data.nick === 'string' ? data.nick : undefined;

      const parsed = PublicProfileSchema.safeParse({
        key: doc.id,
        nick,
        username: data.username || (nick ? toFid(nick) : undefined),
        avatarURL: data.avatarURL || data.photoURL || undefined,
      });

      if (parsed.success) {
        result[doc.id] = parsed.data;
      }
    }
  } catch (error) {
    logError('getPublicProfiles', 'Failed to batch fetch profiles:', error);
  }

  return result;
}
