import type { MarkedExtension, Tokens } from 'marked';
import type { Asset } from 'src/schemas/AssetSchema';
import { escapeHtml } from './escapeHtml';

type AttachmentToken = Tokens.Generic & { name: string };

/**
 * Creates a marked extension that resolves `attach:<name>` against the
 * site's attachment list. Requires site context; without it, the notation
 * stays literal because the extension is not installed. See
 * specs/pelilauta/markdown/spec.md.
 *
 * - images render the asset URL with the filename as alt text
 * - other files link the asset URL with the filename as text
 * - a missing file links the original notation to the upload page
 */
export function createAttachmentExtension(
  origin: string,
  siteKey: string,
  assets: readonly Asset[] = [],
): MarkedExtension {
  if (!origin || !siteKey) {
    throw new Error('origin and siteKey are required for attachments.');
  }
  return {
    extensions: [
      {
        name: 'attachment',
        level: 'inline',
        start(src: string) {
          const index = src.indexOf('attach:');
          return index < 0 ? undefined : index;
        },
        tokenizer(this, src: string): AttachmentToken | undefined {
          if (this.lexer.state.inLink) return undefined;
          const match = /^attach:([^\s<]+)/.exec(src);
          if (!match) return undefined;
          return { type: 'attachment', raw: match[0], name: match[1] };
        },
        renderer(token: Tokens.Generic): string {
          const { name, raw } = token as AttachmentToken;
          const asset = assets.find((a) => a.name === name);
          if (!asset) {
            const href = `${origin}/sites/${siteKey}/add/asset?name=${encodeURIComponent(name)}`;
            return `<a href="${escapeHtml(href)}">${escapeHtml(raw)}</a>`;
          }
          if (asset.mimetype?.startsWith('image/')) {
            return `<img src="${escapeHtml(asset.url)}" alt="${escapeHtml(name)}">`;
          }
          return `<a href="${escapeHtml(asset.url)}">${escapeHtml(name)}</a>`;
        },
      },
    ],
  };
}
