import { marked } from 'marked';

export interface SnippetOptions {
  /**
   * Maximum length in characters (including whitespace)
   * @default 220
   */
  maxLength?: number;

  /**
   * Whether to add ellipsis when truncated
   * @default true
   */
  addEllipsis?: boolean;

  /**
   * CSS classes to add to headers
   * @default ['text-h5']
   */
  headerClasses?: string[];

  /**
   * CSS classes to add to paragraphs
   * Set to empty array to disable paragraph styling
   * @default []
   */
  paragraphClasses?: string[];

  /**
   * Whether to preserve complete semantic blocks
   * @default true
   */
  respectSemanticBoundaries?: boolean;
}

/**
 * Creates a rich HTML snippet from markdown content.
 *
 * - Renders markdown using marked
 * - Adds styling classes (text-h5 to headers)
 * - Optionally adds styling classes to paragraphs (disabled by default)
 * - Intelligently truncates while preserving HTML structure
 * - Adds ellipsis when content is cut off
 *
 * @param markdownContent - The markdown string to convert
 * @param options - Configuration options
 * @returns Rendered and truncated HTML string
 *
 * @example
 * ```typescript
 * const snippet = await createRichSnippet(
 *   '# Welcome\n\nThis is **bold** text.',
 *   { maxLength: 50, paragraphClasses: ['text-small'] }
 * );
 * // Returns: '<h1 class="text-h5">Welcome</h1><p class="text-small">This is <strong>bold</strong> text.</p>'
 * ```
 */
export async function createRichSnippet(
  markdownContent: string,
  options: SnippetOptions = {},
): Promise<string> {
  const {
    maxLength = 220,
    addEllipsis = true,
    headerClasses = ['text-h5'],
    paragraphClasses = [],
    respectSemanticBoundaries = true,
  } = options;

  if (!markdownContent || markdownContent.trim().length === 0) {
    return '';
  }

  // Step 1: Render markdown to HTML
  const rawHtml = await marked.parse(markdownContent);

  // Step 2: Add CSS classes to headers and paragraphs
  let styledHtml = addHeaderClasses(rawHtml, headerClasses);
  styledHtml = addParagraphClasses(styledHtml, paragraphClasses);

  // Step 3: Truncate intelligently if needed
  const visibleTextLength = getVisibleTextLength(styledHtml);

  if (visibleTextLength <= maxLength) {
    return styledHtml.trim();
  }

  // Step 4: Smart truncate
  const truncated = smartTruncateHtml(
    styledHtml,
    maxLength,
    respectSemanticBoundaries,
  );

  // Step 5: Add ellipsis if needed
  if (addEllipsis) {
    return addEllipsisToHtml(truncated);
  }

  return truncated;
}

/**
 * Creates a plain-text snippet from markdown content.
 *
 * Suitable for meta descriptions, RSS feeds, and other contexts
 * where HTML is not appropriate.
 *
 * @param markdownContent - The markdown string to convert
 * @param maxLength - Maximum length in characters (default: 220)
 * @returns Plain text snippet with ellipsis if truncated
 *
 * @example
 * ```typescript
 * const description = createPlainSnippet(
 *   '# Welcome\n\nThis is **bold** text.',
 *   160
 * );
 * // Returns: 'Welcome This is bold text.'
 * ```
 */
export function createPlainSnippet(
  markdownContent: string,
  maxLength = 220,
): string {
  if (!markdownContent || markdownContent.trim().length === 0) {
    return '';
  }

  // Remove markdown syntax patterns
  const plainText = markdownContent
    // Headers
    .replace(/^#{1,6}\s+/gm, '')
    // Images ![alt](url) - must come before links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // List markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // HTML tags
    .replace(/<[^>]*>/g, '')
    // Multiple newlines -> single space
    .replace(/\n\n+/g, ' ')
    .replace(/\n/g, ' ')
    // Multiple spaces -> single space
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate at word boundary if needed
  if (plainText.length > maxLength) {
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      // Cut at last space if it's not too far back
      return `${truncated.substring(0, lastSpace)}...`;
    }

    return `${truncated}...`;
  }

  return plainText;
}

/**
 * Adds CSS classes to header tags in HTML string.
 *
 * @param html - HTML string to process
 * @param classes - Array of CSS class names to add
 * @returns HTML with classes added to headers
 */
export function addHeaderClasses(html: string, classes: string[]): string {
  if (!classes || classes.length === 0) {
    return html;
  }

  const classString = classes.join(' ');

  // Add classes to all header tags (h1-h6) that don't already have classes
  let result = html.replace(/<(h[1-6])>/gi, `<$1 class="${classString}">`);

  // For headers that already have classes, append new classes (avoiding duplicates)
  result = result.replace(
    /<(h[1-6])\s+class="([^"]*)"/gi,
    (match, tag, existingClasses) => {
      const existingSet = new Set(existingClasses.split(' ').filter(Boolean));
      const newClasses = classes.filter((c) => !existingSet.has(c));
      if (newClasses.length === 0) {
        return match; // No new classes to add
      }
      return `<${tag} class="${existingClasses} ${newClasses.join(' ')}"`;
    },
  );

  return result;
}

/**
 * Adds CSS classes to paragraph tags in HTML string.
 *
 * @param html - HTML string to process
 * @param classes - Array of CSS class names to add
 * @returns HTML with classes added to paragraphs
 */
export function addParagraphClasses(html: string, classes: string[]): string {
  if (!classes || classes.length === 0) {
    return html;
  }

  const classString = classes.join(' ');

  // Add classes to all paragraph tags that don't already have classes
  let result = html.replace(/<p>/gi, `<p class="${classString}">`);

  // For paragraphs that already have classes, append new classes (avoiding duplicates)
  result = result.replace(
    /<p\s+class="([^"]*)"/gi,
    (match, existingClasses) => {
      const existingSet = new Set(existingClasses.split(' ').filter(Boolean));
      const newClasses = classes.filter((c) => !existingSet.has(c));
      if (newClasses.length === 0) {
        return match; // No new classes to add
      }
      return `<p class="${existingClasses} ${newClasses.join(' ')}"`;
    },
  );

  return result;
}

/**
 * Calculates the visible text length of an HTML string.
 * Excludes HTML tags from the count.
 *
 * @param html - HTML string
 * @returns Character count of visible text
 */
export function getVisibleTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, '').length;
}

/**
 * Intelligently truncates HTML content while preserving structure.
 *
 * @param html - HTML string to truncate
 * @param maxLength - Maximum visible text length
 * @param _respectBoundaries - Whether to respect semantic boundaries (reserved for future use)
 * @returns Truncated HTML with properly closed tags
 */
export function smartTruncateHtml(
  html: string,
  maxLength: number,
  _respectBoundaries: boolean,
): string {
  const tagStack: string[] = [];
  let visibleChars = 0;
  let result = '';
  let i = 0;

  while (i < html.length && visibleChars < maxLength) {
    // Check for HTML tag
    if (html[i] === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) break;

      const tag = html.substring(i, tagEnd + 1);
      result += tag;

      // Track opening/closing tags
      const tagMatch = tag.match(/<\/?(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        if (tag.startsWith('</')) {
          // Closing tag
          const lastIndex = tagStack.lastIndexOf(tagName);
          if (lastIndex !== -1) {
            tagStack.splice(lastIndex, 1);
          }
        } else if (!tag.endsWith('/>') && !isSelfClosingTag(tagName)) {
          // Opening tag (not self-closing)
          tagStack.push(tagName);
        }
      }

      i = tagEnd + 1;
    } else {
      // Regular text character
      result += html[i];
      visibleChars++;
      i++;
    }
  }

  // Close any remaining open tags
  while (tagStack.length > 0) {
    const tagName = tagStack.pop();
    result += `</${tagName}>`;
  }

  return result;
}

/**
 * Checks if an HTML tag is self-closing (void element).
 *
 * @param tagName - The tag name to check
 * @returns True if the tag is self-closing
 */
function isSelfClosingTag(tagName: string): boolean {
  const selfClosingTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ];
  return selfClosingTags.includes(tagName.toLowerCase());
}

/**
 * Adds ellipsis to truncated HTML content.
 * Attempts to add inside the last text node before closing tags.
 *
 * @param html - HTML string
 * @returns HTML with ellipsis added
 */
export function addEllipsisToHtml(html: string): string {
  // Find all closing tags at the end
  const closingTagsMatch = html.match(/(<\/\w+>)+$/);

  if (closingTagsMatch) {
    const closingTags = closingTagsMatch[0];
    const beforeClosing = html.substring(0, html.length - closingTags.length);

    // Find the last text content (not inside a tag)
    const textMatch = beforeClosing.match(/([^<>]+)$/);
    if (textMatch) {
      const lastText = textMatch[1];
      const beforeText = beforeClosing.substring(
        0,
        beforeClosing.length - lastText.length,
      );
      return `${beforeText + lastText.trimEnd()}...${closingTags}`;
    }

    // If no text found, just add before closing tags
    return `${beforeClosing}...${closingTags}`;
  }

  // No closing tags, just append
  return `${html.trimEnd()}...`;
}
