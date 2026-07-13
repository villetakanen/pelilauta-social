import type { ContentEntry } from 'src/schemas/ContentEntry';
import TurndownService from 'turndown';

interface AbstractEntry {
  [key: string]: unknown;
}

const td = new TurndownService();

export const DEFAULT_PROPS = ['key', 'createdAt', 'updatedAt', 'tags'];

export function propsToFrontmatter(
  entry: AbstractEntry,
  props: string[],
): string {
  const frontmatter = props
    .map((prop) => {
      const value = entry[prop];
      if (value) {
        return `${prop}: ${value}`;
      }
      return '';
    })
    .join('\n');

  return `---\n${frontmatter}\n---\n`;
}

/**
 * Converts a ContentEntry to a Markdown string, with frontmatter
 *
 * Default props are:
 * - key
 * - createdAt
 * - updatedAt
 * - tags
 */
export function entryToMarkdown(
  entry: ContentEntry,
  props = DEFAULT_PROPS,
  raw = false,
): string {
  // If we have a htmlContent, the entry content contain pre-rendered HTML, which should
  // be used instead of the markdownContent (unless raw is true)
  const content = raw
    ? entry.markdownContent
    : entry.htmlContent
      ? td.turndown(entry.htmlContent)
      : entry.markdownContent;
  return `${propsToFrontmatter(entry, props)}${content}`;
}
