import { z } from 'zod';
import { EntrySchema } from './EntrySchema';

export const ContentEntrySchema = EntrySchema.extend({
  public: z.boolean().optional(),
  sticky: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  markdownContent: z.string().optional(),
  htmlContent: z.string().optional(),
  content: z.string().optional(), // Legacy content field
  images: z.array(z.string()).optional(),
  owners: z.array(z.string()),
  author: z.string().optional(), // Track last editor
});

export type ContentEntry = z.infer<typeof ContentEntrySchema>;

export function contentEntryFrom(
  data: Partial<ContentEntry>,
  key?: string,
): ContentEntry {
  return ContentEntrySchema.parse({
    ...data,
    key: key || data.key || '',
    owners: data.owners || [],
    markdownContent: data.markdownContent || '',
    htmlContent: data.htmlContent || '',
    content: data.content || '',
    images: data.images || [],
  });
}
