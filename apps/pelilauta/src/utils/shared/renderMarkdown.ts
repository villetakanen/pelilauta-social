import type { Asset } from 'src/schemas/AssetSchema';
import { getMarkedInstance } from './getMarked';
import { sanitizeHtml } from './sanitizeHtml';

export type RenderMarkdownOptions = {
  /** Origin for absolute links, e.g. `https://pelilauta.social`. */
  origin: string;
  /** Site context; required for wiki links and attachments. */
  site?: { key: string; assets?: readonly Asset[] };
  /** Render footnotes. Requires `namespace`. Default false. */
  footnotes?: boolean;
  /** Link `#tag` to the tag page. Default false. */
  hashtags?: boolean;
  /** Footnote identifier namespace: ASCII letters, digits and hyphens. */
  namespace?: string;
};

/**
 * The single entry point for rendering user Markdown, on the server and in
 * the browser. Parses with a fresh configured instance and sanitizes the
 * result. See specs/pelilauta/markdown/spec.md.
 */
export function renderMarkdown(
  source: string,
  options: RenderMarkdownOptions,
): string {
  const { origin, site, namespace } = options;
  if (!origin) throw new Error('origin is required to render Markdown.');
  const footnotes = options.footnotes ?? false;
  const marked = getMarkedInstance({
    origin,
    site,
    footnotes,
    hashtags: options.hashtags ?? false,
    namespace,
  });
  const html = marked.parse(source, { async: false });
  return sanitizeHtml(html, { namespace: footnotes ? namespace : undefined });
}
