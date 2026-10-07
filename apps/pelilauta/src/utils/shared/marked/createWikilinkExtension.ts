import {
  type MarkedExtension,
  Renderer,
  type RendererThis,
  type Tokens,
} from 'marked';

const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const PRESERVED_PREFIX = /^(?:\/|\.\/|\.\.\/|#|\?)/;

function toDashCase(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-');
}

/**
 * Resolves a destination or wiki name to a URL for the supplied site.
 * Destinations starting with `/`, `./`, `../`, `#`, `?` or carrying a URL
 * scheme are preserved; others resolve as wiki names, where a slash
 * separates site from page.
 */
export function createWikiResolver(origin: string, siteKey: string) {
  if (!origin || !siteKey) {
    throw new Error('origin and siteKey are required for wiki links.');
  }
  const currentSite = toDashCase(siteKey);

  function resolveWikiName(name: string): string {
    const slash = name.indexOf('/');
    if (slash >= 0) {
      const site = toDashCase(name.slice(0, slash));
      const page = toDashCase(name.slice(slash + 1));
      return `${origin}/sites/${site}/${page}`;
    }
    return `${origin}/sites/${currentSite}/${toDashCase(name)}`;
  }

  function resolveDestination(href: string): string {
    if (href === '' || PRESERVED_PREFIX.test(href) || SCHEME.test(href)) {
      return href;
    }
    return resolveWikiName(href);
  }

  return { resolveWikiName, resolveDestination };
}

type WikiToken = Tokens.Generic & { target: string; text: string };

/**
 * Inline tokenizers for `[Page Name]`, `[[Page Name]]` and
 * `[[Page Name|label]]`. Defined Markdown references precede wiki
 * shortcuts. The destination rewriting for `[text](target)` lives in the
 * link renderer, which receives `resolveDestination`.
 */
export function createWikilinkExtension(
  origin: string,
  siteKey: string,
): MarkedExtension {
  const { resolveWikiName } = createWikiResolver(origin, siteKey);

  function labelTokens(
    lexer: {
      state: { inLink: boolean };
      inlineTokens: (s: string) => Tokens.Generic[];
    },
    text: string,
  ) {
    const previous = lexer.state.inLink;
    lexer.state.inLink = true;
    try {
      return lexer.inlineTokens(text);
    } finally {
      lexer.state.inLink = previous;
    }
  }

  function render(this: RendererThis, token: Tokens.Generic): string {
    const wiki = token as WikiToken;
    return Renderer.prototype.link.call(
      this as unknown as Renderer,
      {
        type: 'link',
        raw: wiki.raw,
        href: resolveWikiName(wiki.target),
        title: null,
        text: wiki.text,
        tokens: wiki.tokens ?? [],
      } as Tokens.Link,
    );
  }

  return {
    extensions: [
      {
        name: 'wikilinkShortcut',
        level: 'inline',
        start: (src: string) => src.indexOf('['),
        tokenizer(this, src: string): WikiToken | undefined {
          if (this.lexer.state.inLink) return undefined;
          const match = /^\[([^[\]]+)\](?![([:])/.exec(src);
          if (!match) return undefined;
          const label = match[1].toLowerCase().replace(/\s+/g, ' ');
          const defined = this.lexer.tokens.links;
          if (defined && Object.hasOwn(defined, label)) return undefined;
          return {
            type: 'wikilinkShortcut',
            raw: match[0],
            target: match[1].trim(),
            text: match[1],
            tokens: labelTokens(this.lexer, match[1]),
          };
        },
        renderer: render,
      },
      {
        name: 'obsidianWikilink',
        level: 'inline',
        start: (src: string) => src.indexOf('[['),
        tokenizer(this, src: string): WikiToken | undefined {
          if (this.lexer.state.inLink) return undefined;
          const match = /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/.exec(src);
          if (!match) return undefined;
          const target = match[1].trim();
          const text = (match[2] || target).trim();
          return {
            type: 'obsidianWikilink',
            raw: match[0],
            target,
            text,
            tokens: labelTokens(this.lexer, text),
          };
        },
        renderer: render,
      },
    ],
  };
}
