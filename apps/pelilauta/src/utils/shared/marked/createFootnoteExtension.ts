import type { MarkedExtension, RendererThis, Tokens } from 'marked';
import markedFootnote from 'marked-footnote';
import { t } from 'src/utils/i18n';
import { escapeHtml } from './escapeHtml';

type Ref = Tokens.Generic & { index: number; id: string };
type Footnote = Tokens.Generic & {
  label: string;
  refs: Ref[];
  content: Tokens.Generic[];
};

export const NAMESPACE_PATTERN = /^[A-Za-z0-9-]+$/;

/**
 * Wraps `marked-footnote` so its output follows the markup contract of
 * specs/pelilauta/markdown/html-sanitization.md: definitions are
 * `fn-<namespace>-<n>`, references `fnref-<namespace>-<n>-<occurrence>`.
 * Footnote links carry an `aria-label`.
 */
export function createFootnoteExtension(namespace: string): MarkedExtension {
  if (!NAMESPACE_PATTERN.test(namespace)) {
    throw new Error(
      'footnotes require a namespace of ASCII letters, digits and hyphens.',
    );
  }
  const library = markedFootnote();
  const extensions = (library.extensions ?? []).map((ext) => {
    if (ext.name === 'footnoteRef') {
      return {
        ...ext,
        renderer(token: Tokens.Generic): string {
          const { index, id } = token as Ref;
          return `<sup><a id="fnref-${namespace}-${id}-${index + 1}" href="#fn-${namespace}-${id}" aria-label="${escapeHtml(t('common:footnote.reference', { n: id }))}">${id}</a></sup>`;
        },
      };
    }
    if (ext.name === 'footnotes') {
      return {
        ...ext,
        renderer(this: RendererThis, token: Tokens.Generic): string {
          const items = (token as Tokens.Generic & { items?: Footnote[] })
            .items;
          if (!items || items.length === 0) return '';
          const list = items
            .map((item, i) => {
              const n = i + 1;
              const body = this.parser.parse(item.content).trimEnd();
              const inParagraph = body.endsWith('</p>');
              const backrefs = item.refs
                .map(
                  (_ref, r) =>
                    ` <a href="#fnref-${namespace}-${n}-${r + 1}" aria-label="${escapeHtml(t('common:footnote.backToReference', { n }))}">↩${r > 0 ? `<sup>${r + 1}</sup>` : ''}</a>`,
                )
                .join('');
              const html = inParagraph
                ? `${body.replace(/<\/p>$/, '')}${backrefs}</p>`
                : `${body}${backrefs}`;
              return `<li id="fn-${namespace}-${n}">\n${html}\n</li>\n`;
            })
            .join('');
          return `<section class="footnotes">\n<ol>\n${list}</ol>\n</section>\n`;
        },
      };
    }
    return ext;
  });
  return { extensions, walkTokens: library.walkTokens } as MarkedExtension;
}

/**
 * Keeps footnote notation literal when footnotes are disabled: neither a
 * `[^label]` reference nor a `[^label]:` definition may become a Markdown
 * reference link or wiki shortcut.
 */
export function createLiteralFootnoteExtension(): MarkedExtension {
  return {
    extensions: [
      {
        name: 'footnoteDefinitionLiteral',
        level: 'block',
        tokenizer(this, src: string) {
          const match = /^\[\^[^\]\n]+\]:[^\n]*(?:\n|$)/.exec(src);
          if (!match) return undefined;
          const text = match[0].replace(/\n$/, '');
          return {
            type: 'paragraph',
            raw: match[0],
            text,
            tokens: this.lexer.inlineTokens(text),
          };
        },
      },
      {
        name: 'footnoteRefLiteral',
        level: 'inline',
        start: (src: string) => src.indexOf('[^'),
        tokenizer(this, src: string) {
          const match = /^\[\^[^\]\n]+\]/.exec(src);
          if (!match) return undefined;
          return { type: 'text', raw: match[0], text: match[0] };
        },
      },
    ],
  };
}
