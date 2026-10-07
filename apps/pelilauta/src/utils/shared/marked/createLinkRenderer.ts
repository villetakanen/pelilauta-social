import { type MarkedExtension, Renderer, type Tokens } from 'marked';

const baseRenderer = new Renderer();

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function unescapeBasic(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
}

/**
 * A link is a bare URL when its visible text equals its destination, whether
 * it came from a GFM autolink or an explicit Markdown link. Descriptive
 * links are not bare. See specs/pelilauta/markdown/spec.md.
 */
function isBareUrl(token: Tokens.Link): boolean {
  if (!token.raw.startsWith('[')) return true;
  return unescapeBasic(token.text) === token.href;
}

/**
 * Always-installed link renderer. Marks bare-URL anchors with `class="url"`
 * and, when a resolver is given, rewrites the destination (wiki names with
 * site context). Escaping and URL cleaning stay with marked's own renderer.
 */
export function createLinkRenderer(
  resolveHref?: (href: string) => string,
): MarkedExtension {
  return {
    renderer: {
      link(this: Renderer, token: Tokens.Link): string {
        const bare = isBareUrl(token);
        const resolved = resolveHref ? resolveHref(token.href) : token.href;
        const html = baseRenderer.link.call(this, { ...token, href: resolved });
        return bare ? html.replace(/^<a /, '<a class="url" ') : html;
      },
    },
  };
}
