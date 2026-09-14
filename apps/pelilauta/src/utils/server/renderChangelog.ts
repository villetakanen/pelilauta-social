import { Marked } from 'marked';

/**
 * Renders the root changelog to HTML. The changelog is plain GitHub-flavoured
 * Markdown, so the instance carries none of the wiki, dice or profile
 * extensions `getMarked.ts` adds to application content.
 */
export function renderChangelog(markdown: string): string {
  const marked = new Marked({ gfm: true });
  return marked.parse(markdown, { async: false }) as string;
}
