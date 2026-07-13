import { logError } from 'src/utils/logHelpers';
import { toDate } from 'src/utils/schemaHelpers';
import { z } from 'zod';
import { ContentEntrySchema } from './ContentEntry';

export const THREADS_COLLECTION_NAME = 'stream';

// Define the base image array schema without default for type inference
const BaseImageArraySchema = z.array(
  z.object({
    url: z.string(),
    alt: z.string(),
  }),
);

// Export the schema with default for validation
export const ImageArraySchema = BaseImageArraySchema.default([]);

// Export the type for use in code
export type ImageArray = z.infer<typeof BaseImageArraySchema>;

export const ThreadSchema = ContentEntrySchema.extend({
  title: z.string(),
  channel: z.string(),
  siteKey: z.string().optional(),
  youtubeId: z.string().optional(),
  poster: z.string().optional(), // URL for the poster image
  images: BaseImageArraySchema.optional(), // Use base schema without default for optional field
  replyCount: z.number().optional(),
  lovedCount: z.number().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  quoteRef: z.string().optional(),
  author: z.string().optional(),

  // Admin-managed persistent tags (labels)
  // These persist through content edits, unlike tags which are extracted from content
  labels: z.array(z.string()).optional(),

  // Bluesky syndication tracking
  blueskyPostUrl: z.url().optional(), // https://bsky.app/profile/[handle]/post/[rkey]
  blueskyPostUri: z.string().optional(), // at://did:plc:xxx/app.bsky.feed.post/yyy
  blueskyPostCreatedAt: z.any().optional(), // When post was created

  // Override owners to ensure at least one owner (the thread author)
  owners: z.array(z.string()).min(1, 'Please add at least one thread owner.'),
});

export type Thread = z.infer<typeof ThreadSchema>;

export function parseThread(
  data: Record<string, unknown>,
  key?: string,
): Thread {
  let images = data.images || undefined;

  // Handle legacy image-data, these are of form { url: 'https://example.com/image.jpg' }
  if (
    data.images &&
    Array.isArray(data.images) &&
    typeof data.images[0] === 'string'
  ) {
    images = data.images.map((url: string) => ({ url, alt: `Image [${url}]` }));
  }

  // Forcing the author to be the first owner
  if (Array.isArray(data.owners) && data.owners.length > 0) {
    data.author = data.owners[0];
  }

  try {
    return ThreadSchema.parse({
      ...data,
      images,
      title: data.title || '',
      channel: data.channel || data.topic || '',
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      flowTime: toDate(data.flowTime).getTime(),
      key,
    });
  } catch (e) {
    logError('parseThread', e);
    throw e;
  }
}

export function createThread(
  source?: Partial<Thread>,
  threadKey?: string,
): Thread {
  // Ensure owners array has at least one entry
  const owners =
    source?.owners && source.owners.length > 0 ? source.owners : ['-'];

  const thread = {
    key: threadKey || source?.key || '',
    title: source?.title || '',
    channel: source?.channel || '',
    siteKey: source?.siteKey || undefined,
    youtubeId: source?.youtubeId || undefined,
    poster: source?.poster || '',
    images: source?.images || [],
    owners,
    author: owners[0],
    replyCount: 0,
    lovedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    flowTime: Date.now(),
    markdownContent: source?.markdownContent || '',
    quoteRef: source?.quoteRef || undefined,
    public: source?.public || true,
    tags: source?.tags || undefined,
    labels: source?.labels || undefined,
  };

  // Remove empty fields, empty strings, and empty arrays (but keep owners even if it's ['-'])
  for (const key of Object.keys(thread) as (keyof typeof thread)[]) {
    if (
      key !== 'owners' &&
      (thread[key] === undefined ||
        thread[key] === null ||
        (typeof thread[key] === 'string' && thread[key] === '') ||
        (Array.isArray(thread[key]) && thread[key].length === 0))
    ) {
      delete thread[key];
    }
  }

  return thread;
}
