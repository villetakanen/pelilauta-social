import { Marked, type MarkedExtension, type Tokens } from 'marked';
import type { Site } from 'src/schemas/SiteSchema';
import type { Thread } from 'src/schemas/ThreadSchema';
import { createProfileTagExtension } from './marked/createProfileTagExtension';

/**
 * Returns a new, configured marked instance for rendering markdown.
 * By creating a new instance, we avoid leaking state between different renders.
 *
 * @param origin The origin URL of the site, used for absolute links.
 * @param references Site and Thread references used to configure the instance.
 * @returns A new, configured `Marked` instance.
 */
export function getMarkedInstance(
  origin: string,
  references?: {
    site?: Site;
    thread?: Thread;
  },
) {
  // Create a new Marked instance to prevent state leakage.
  const marked = new Marked({
    gfm: true,
    breaks: true,
    pedantic: false,
  });

  // Use the profile tag extension
  marked.use(createProfileTagExtension(origin));

  if (references?.site) {
    // Use the single, comprehensive extension for all link types.
    const wikilinkExtension = createWikilinkExtension(
      origin,
      references.site.key,
    );
    marked.use(wikilinkExtension);
  }

  // You could add other extensions for threads here if needed
  // if (references.thread) { ... }

  return marked;
}

/**
 * Creates a marked extension to handle a comprehensive set of wiki-style links.
 *
 * Supports:
 * 1. Standard links: `[text](target)` (rewrites relative URLs)
 * 2. Shortcut links: `[Page Name]`
 * 3. Obsidian-style wikilinks: `[[Page Name]]` or `[[site/Page Name]]`
 * 4. Obsidian-style aliased links: `[[Page Name|Custom Display Text]]`
 *
 * @param baseUrl The base URL of the application (e.g., 'https://example.com').
 * @param currentSite The key or slug of the current site.
 * @returns A configured `MarkedExtension` object.
 */
function createWikilinkExtension(
  baseUrl: string,
  currentSite: string,
): MarkedExtension {
  if (!baseUrl || !currentSite) {
    throw new Error(
      'baseUrl and currentSite are required for wikilink extension.',
    );
  }

  function rewriteUrl(linkTarget: string): string {
    if (/^https?:\/\//.test(linkTarget) || /^mailto:/.test(linkTarget)) {
      return linkTarget;
    }
    if (linkTarget.includes('/')) {
      const parts = linkTarget.split('/');
      const site = toDashCase(parts[0]);
      const path = toDashCase(parts.slice(1).join('/'));
      return `${baseUrl}/sites/${site}/${path}`;
    }
    return `${baseUrl}/sites/${currentSite}/${toDashCase(linkTarget)}`;
  }

  // Define custom token types for clarity
  type WikilinkShortcutToken = Tokens.Generic & { text: string };
  type ObsidianWikilinkToken = Tokens.Generic & {
    target: string;
    text: string;
  };

  return {
    // This renderer overrides the default behavior for standard [text](target) links
    renderer: {
      link(token: Tokens.Link): string {
        const { href, title, text } = token;
        const rewrittenHref = rewriteUrl(href);
        const titleAttr = title ? ` title="${title}"` : '';
        // Use `token.text` for the raw text, which marked will parse.
        // If you manually parse `token.tokens`, you might get double-parsing.
        return `<a href="${rewrittenHref}"${titleAttr}>${text}</a>`;
      },
    },

    // This array holds all of our custom syntax definitions
    extensions: [
      {
        name: 'wikilinkShortcut',
        level: 'inline',
        start: (src: string) => src.indexOf('['),
        tokenizer(src: string): WikilinkShortcutToken | undefined {
          const rule = /^\[([^\]]+)\](?![(:(])/; // Does not match [text]() or [ref]:
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'wikilinkShortcut',
              raw: match[0],
              text: match[1],
              tokens: this.lexer.inlineTokens(match[1]),
            };
          }
          return undefined;
        },
        renderer(token: Tokens.Generic): string {
          const wikiToken = token as WikilinkShortcutToken;
          const href = rewriteUrl(wikiToken.text);
          return `<a href="${href}">${this.parser.parseInline(wikiToken.tokens || [])}</a>`;
        },
      },
      {
        name: 'obsidianWikilink',
        level: 'inline',
        start: (src: string) => src.indexOf('[['),
        tokenizer(src: string): ObsidianWikilinkToken | undefined {
          const rule = /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/;
          const match = rule.exec(src);
          if (match) {
            const target = match[1].trim();
            const text = (match[2] || target).trim();
            return {
              type: 'obsidianWikilink',
              raw: match[0],
              target,
              text,
              tokens: this.lexer.inlineTokens(text),
            };
          }
          return undefined;
        },
        // FIX: The renderer must be a property of the extension object, not nested in the tokenizer.
        renderer(token: Tokens.Generic): string {
          const wikiToken = token as ObsidianWikilinkToken;
          const href = rewriteUrl(wikiToken.target);
          return `<a href="${href}">${this.parser.parseInline(wikiToken.tokens || [])}</a>`;
        },
      },
    ],
  };
}

// Helper function for creating slugs
function toDashCase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s/]+/g, '-');
}
