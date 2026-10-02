import { toFid } from 'src/utils/toFid';
import { z } from 'zod';

export const PROFILES_COLLECTION_NAME = 'profiles';

export const ProfileLinkSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(50),
});

export type ProfileLink = z.infer<typeof ProfileLinkSchema>;

export const ProfileSchema = z.object({
  key: z.string(),
  username: z.string(),
  nick: z.string(),
  avatarURL: z.string().optional(),
  bio: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lovedThreads: z.array(z.string()).optional(),
  links: z.array(ProfileLinkSchema).optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export function parseProfile(
  data: Record<string, unknown>,
  key: string,
): Profile {
  const nick = data.nick ? (data.nick as string) : 'N.N.';

  const username = data.username ? data.username : toFid(nick);

  return ProfileSchema.parse({
    ...data,
    nick,
    username,
    key,
  });
}

/**
 * Migrates legacy profile data to the current schema.
 * Handles missing fields and legacy field names (e.g., photoURL -> avatarURL).
 *
 * @param data - Raw profile data from Firestore
 * @param key - Profile document ID (uid)
 * @returns Migrated profile that conforms to current schema
 */
export function migrateProfile(
  data: Record<string, unknown>,
  key: string,
): Profile {
  // Ensure data is an object
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid profile data');
  }

  // Handle legacy photoURL field (renamed to avatarURL)
  const avatarURL = data.avatarURL || data.photoURL || '';

  // Ensure nick has a value (required field)
  const nick = data.nick ? String(data.nick) : 'N.N.';

  // Generate username from nick if missing
  const username = data.username ? String(data.username) : toFid(nick);

  // Ensure arrays are properly typed
  const tags = Array.isArray(data.tags)
    ? data.tags.filter((tag): tag is string => typeof tag === 'string')
    : [];

  const lovedThreads = Array.isArray(data.lovedThreads)
    ? data.lovedThreads.filter(
        (thread): thread is string => typeof thread === 'string',
      )
    : [];

  // Handle links array
  let links: ProfileLink[] = [];
  if (Array.isArray(data.links)) {
    // Filter and validate links
    links = data.links
      .filter(
        (link): link is Record<string, unknown> =>
          typeof link === 'object' &&
          link !== null &&
          typeof link.url === 'string' &&
          typeof link.label === 'string',
      )
      .map((link) => ({
        url: String(link.url),
        label: String(link.label),
      }))
      // Validate against schema to be sure (optional, but good for validation)
      .filter((link) => {
        const result = ProfileLinkSchema.safeParse(link);
        return result.success;
      });
  }

  // Build migrated profile with all fields
  const migratedData: Record<string, unknown> = {
    key,
    nick,
    username,
  };

  // Add optional fields only if they have values
  if (avatarURL) {
    migratedData.avatarURL = String(avatarURL);
  }

  if (data.bio && typeof data.bio === 'string') {
    migratedData.bio = data.bio;
  }

  if (tags.length > 0) {
    migratedData.tags = tags;
  }

  if (lovedThreads.length > 0) {
    migratedData.lovedThreads = lovedThreads;
  }

  if (links.length > 0) {
    migratedData.links = links;
  }

  return ProfileSchema.parse(migratedData);
}
