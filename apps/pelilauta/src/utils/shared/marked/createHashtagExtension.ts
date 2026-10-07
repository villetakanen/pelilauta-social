import type { MarkedExtension, Token, Tokens } from 'marked';
import { escapeHtml } from './escapeHtml';
import { followsBoundary } from './proseBoundary';

type HashtagToken = Tokens.Generic & { label: string };

/**
 * Creates a marked extension that links `#tag` in prose to
 * `<origin>/tags/<identifier>`. Applies only to prose: code, raw HTML,
 * link labels and destinations never convert. See
 * specs/pelilauta/markdown/spec.md.
 */
export function createHashtagExtension(origin: string): MarkedExtension {
  if (!origin) {
    throw new Error('origin is required for hashtag extension.');
  }
  const RULE = /^#([\p{L}\p{Nd}_\-&+]+)/u;
  const MARKER = /[\s([{'"]/;

  return {
    extensions: [
      {
        name: 'hashtag',
        level: 'inline',
        start(src: string) {
          const index = src.indexOf('#');
          return index < 0 ? undefined : index;
        },
        tokenizer(
          this,
          src: string,
          tokens?: Token[],
        ): HashtagToken | undefined {
          if (this.lexer.state.inLink) return undefined;
          const match = RULE.exec(src);
          if (!match) return undefined;
          if (!followsBoundary(tokens?.at(-1), MARKER)) return undefined;
          return {
            type: 'hashtag',
            raw: match[0],
            label: match[0],
            id: match[1],
          };
        },
        renderer(token: Tokens.Generic): string {
          const { label, id } = token as HashtagToken & { id: string };
          const href = `${origin}/tags/${encodeURIComponent(id.toLowerCase())}`;
          return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
        },
      },
    ],
  };
}
