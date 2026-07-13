// Not an entry!
import { z } from 'zod';
export const PAGE_HISTORY_COLLECTION_NAME = 'history';

const PageRevisionSchema = z.object({
  // This is an epoch timestamp of the revision
  createdAt: z.number(),
  // The author of the revision, typically a firebase user UID
  author: z.string(),
  // Legacy history support for full markdown content revisions
  markdownContent: z.string().optional(),
  // Change as a diff, from the current revision to the previous one (reverse diff)
  change: z.string().optional(),
});

export const PageHistorySchema = z.object({
  key: z.string(), // This is the key of the page!
  history: z.array(PageRevisionSchema).default([]),
  // Owners are checked from the parent site Entry in the db - so we don't need to store them here
});

export type PageHistory = z.infer<typeof PageHistorySchema>;
