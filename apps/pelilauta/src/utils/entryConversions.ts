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

/**
 * Splits a Markdown file into its frontmatter and body.
 *
 * Frontmatter is read as flat key/value pairs: quoted values are unquoted, and
 * `true`, `false` and plain numbers are coerced. A file without frontmatter is
 * all body.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterStr, body] = match;
  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (
      value.trim() !== '' &&
      !Number.isNaN(Number(value)) &&
      value.trim() === value
    ) {
      frontmatter[key] = Number(value);
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: body.trim() };
}

/**
 * Reads a frontmatter date. Imported content carries the dates of the system it
 * came from, so a page keeps them instead of being stamped with the time of the
 * import. A value that is not a readable date is dropped, and the page falls
 * back to server time.
 */
export function toEntryDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
