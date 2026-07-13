import { logError } from 'src/utils/logHelpers';
import { toDate } from 'src/utils/schemaHelpers';
import { z } from 'zod';
import { ContentEntrySchema, contentEntryFrom } from './ContentEntry';

export const PAGES_COLLECTION_NAME = 'pages';

export const RevisionSchema = z.object({
  // Revision author is the uid of the user who made the revision
  author: z.string(),
  // We timestamp revisions with the time they were
  // created at server-side, defaulting to now if not provided
  // createdAt: z.coerce.date().default(() => new Date()),
  // Legacy support for full markdown content revisions
  markdownContent: z.string().optional(),
  // /sites/:siteKey/pages/:pageKey/revisions/:revisionKey for post diff-style revisions
  revisionKey: z.string().optional(),
});

export const PageSchema = ContentEntrySchema.extend({
  name: z.string(),
  siteKey: z.string(),
  content: z.string().optional(),
  category: z.string().optional(),
  // Revision count is the length of the revisions history array
  revisionHistory: z.array(RevisionSchema).optional(),
});

export type Page = z.infer<typeof PageSchema>;

export const parsePage = (
  data: Partial<Page>,
  key = '',
  siteKey = '',
): Page => {
  const revisionHistory = [];
  if (data.revisionHistory && Array.isArray(data.revisionHistory)) {
    for (const revision of data.revisionHistory) {
      const { author, markdownContent } = revision;
      revisionHistory.push({
        author,
        markdownContent,
      });
    }
  }

  // Ensure author is set (fallback to owners[0] for backward compatibility)
  const owners =
    typeof data.owners === 'string'
      ? [data.owners]
      : data.owners
        ? data.owners
        : [];
  const author = data.author || owners[0] || '';

  try {
    return PageSchema.parse({
      ...data,
      siteKey:
        data.siteKey && typeof data.siteKey === 'string'
          ? data.siteKey
          : siteKey,
      owners,
      flowTime: toDate(data.flowTime).getTime(),
      key,
      revisionHistory,
      markdownContent: data.markdownContent || '',
      author,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      logError(err.issues);
    }
    throw err;
  }
};

export function pageFrom(
  data: Partial<Page>,
  key?: string,
  siteKey?: string,
): Page {
  const contentEntry = contentEntryFrom(data, key);

  return PageSchema.parse({
    ...data,
    ...contentEntry,
    siteKey: siteKey || data.siteKey,
  });
}
