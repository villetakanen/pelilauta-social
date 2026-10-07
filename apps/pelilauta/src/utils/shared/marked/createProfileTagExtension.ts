import type { MarkedExtension, Token, Tokens } from 'marked';
import { escapeHtml } from './escapeHtml';
import { followsBoundary } from './proseBoundary';

type ProfileToken = Tokens.Generic & { label: string; id: string };

/**
 * Creates a marked extension to handle @profile references.
 *
 * Supports:
 * - @profileName -> <a href="<origin>/profiles/profilename">@profileName</a>
 *
 * The marker follows the start of prose or whitespace. A following dot and
 * letter rejects the whole candidate; code, raw HTML, link labels and
 * destinations never convert. See specs/pelilauta/markdown/spec.md.
 *
 * @param baseUrl The base URL of the application (e.g., 'https://example.com').
 * @returns A configured `MarkedExtension` object for profile tags.
 */
export function createProfileTagExtension(baseUrl: string): MarkedExtension {
  if (!baseUrl) {
    throw new Error('baseUrl is required for profile tag extension.');
  }
  const RULE = /^@([a-zA-Z0-9À-ſ_-]+)/;
  const DOT_LETTER = /^\.\p{L}/u;
  const MARKER = /\s/;

  return {
    extensions: [
      {
        name: 'profileTag',
        level: 'inline',
        start(src: string) {
          const index = src.indexOf('@');
          return index < 0 ? undefined : index;
        },
        tokenizer(
          this,
          src: string,
          tokens?: Token[],
        ): ProfileToken | undefined {
          if (this.lexer.state.inLink) return undefined;
          const match = RULE.exec(src);
          if (!match) return undefined;
          // The maximal run is the candidate; a following dot and letter
          // rejects all of it, never a prefix.
          if (DOT_LETTER.test(src.slice(match[0].length))) return undefined;
          if (!followsBoundary(tokens?.at(-1), MARKER)) return undefined;
          return {
            type: 'profileTag',
            raw: match[0],
            label: match[0],
            id: match[1],
          };
        },
        renderer(token: Tokens.Generic): string {
          const { label, id } = token as ProfileToken;
          const href = `${baseUrl}/profiles/${encodeURIComponent(id.toLowerCase())}`;
          return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
        },
      },
    ],
  };
}
