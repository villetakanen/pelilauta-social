import { logError } from 'src/utils/logHelpers';
import { z } from 'zod';
import { ContentEntrySchema } from './ContentEntry';
import { ImageArraySchema } from './ThreadSchema';

export const REPLIES_COLLECTION = 'comments';

export const ReplySchema = ContentEntrySchema.extend({
  // -- extended from EntrySchema
  // key: z.string(),
  // flowTime: z.number(),
  // owners: z.array(z.string()),
  // createdAt: z.date().optional(),
  // updatedAt: z.date().optional(),

  // -- extended from ContentEntrySchema
  // public: z.boolean().optional(),
  // sticky: z.boolean().optional(),
  // tags: z.array(z.string()).optional(),
  // markdownContent: z.string().optional(),
  // htmlContent: z.string().optional(),
  // owners: z.array(z.string()),

  // Override owners to ensure at least one owner (the reply author)
  owners: z.array(z.string()).min(1, 'Reply must have at least one owner'),

  // A reply states when it was written. Reading order is creation order, so a
  // record without a creation time has no place in a discussion: it fails here
  // and the discussion reports itself incomplete. The coercion `EntrySchema`
  // states is kept, because a reply also arrives as JSON from
  // `/api/replies/[threadKey]/[replyKey].json`, with its dates as strings.
  createdAt: z.coerce.date(),

  images: ImageArraySchema.optional(), // Array of images in the reply
  quoteref: z.string().optional(), // The key of the reply that this reply is quoting.
  threadKey: z.string(), // The key of the thread that this reply is in.
});

export type Reply = z.infer<typeof ReplySchema>;

export function parseReply(
  data: Partial<Reply>,
  key?: string,
  threadKey?: string,
): Reply {
  try {
    return ReplySchema.parse({
      ...data,
      key,
      threadKey,
    });
  } catch (e) {
    logError('parseReply', e);
    throw e;
  }
}
