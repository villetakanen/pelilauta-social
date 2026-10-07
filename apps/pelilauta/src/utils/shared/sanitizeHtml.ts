import sanitize from 'sanitize-html';

/**
 * The shared HTML output boundary; policy in
 * specs/pelilauta/markdown/html-sanitization.md. Used by renderMarkdown and
 * for stored HTML fallbacks, which skip Markdown parsing.
 */

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'em',
  'strong',
  'b',
  'i',
  's',
  'del',
  'sub',
  'sup',
  'abbr',
  'mark',
  'small',
  'span',
  'blockquote',
  'q',
  'cite',
  'pre',
  'code',
  'kbd',
  'samp',
  'var',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'details',
  'summary',
  'section',
  'input',
];

/** Removed together with their contents. */
const REMOVED_WITH_CONTENT = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'svg',
  'math',
];

/** Carries an image's alt text through the first pass; see sanitizeHtml. */
const ALT_MARKER = 'data-rejected-alt';

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  '*': ['title', 'lang', 'dir'],
  a: ['href', 'class', 'id', 'aria-label'],
  img: ['src', 'alt', 'width', 'height', ALT_MARKER],
  ol: ['start', 'reversed'],
  li: ['value', 'id'],
  th: ['colspan', 'rowspan', 'align', 'scope'],
  td: ['colspan', 'rowspan', 'align'],
  details: ['open'],
  input: ['type', 'checked', 'disabled'],
  section: ['class'],
  span: [
    'class',
    'role',
    'aria-label',
    'data-sides',
    'data-value',
    'data-kind',
    'data-length',
  ],
};

const DICE_SIDES = new Set(['2', '4', '6', '8', '10', '12', '20']);
const DICE_KINDS = new Set(['die', 'result', 'target']);
const POSITIVE_INT = /^[1-9]\d*$/;
const INT = /^-?\d+$/;
const NAMESPACE = /^[A-Za-z0-9-]+$/;
const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

type Attribs = Record<string, string>;

/** Strips control characters and whitespace browsers ignore in URLs. */
function normalizeUrl(url: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: URL hardening
  return url.replace(/[\x00-\x20\x7f-\x9f]/g, '');
}

function isSafeUrl(url: string, schemes: string[]): boolean {
  const normalized = normalizeUrl(url);
  const match = SCHEME.exec(normalized);
  if (!match) {
    // Reject entity-obfuscated or otherwise colon-bearing first segments.
    return !/^[^/?#]*:/.test(normalized);
  }
  return schemes.includes(match[1].toLowerCase());
}

function keep(
  attribs: Attribs,
  valid: (name: string, value: string) => boolean,
) {
  const out: Attribs = {};
  for (const [name, value] of Object.entries(attribs)) {
    if (valid(name, value)) out[name] = value;
  }
  return out;
}

function createPolicy(namespace: string | undefined) {
  const ns = namespace && NAMESPACE.test(namespace) ? namespace : undefined;
  const defId = ns ? new RegExp(`^fn-${ns}-[1-9]\\d*$`) : undefined;
  const refId = ns
    ? new RegExp(`^fnref-${ns}-[1-9]\\d*-[1-9]\\d*$`)
    : undefined;
  const isFootnoteId = (v: string) => Boolean(defId?.test(v) || refId?.test(v));
  const isFootnoteHref = (v: string) =>
    Boolean(
      ns &&
        (v.startsWith(`#fn-${ns}-`) || v.startsWith(`#fnref-${ns}-`)) &&
        isFootnoteId(v.slice(1)),
    );

  function cleanAttribs(tag: string, attribs: Attribs): Attribs {
    const common = keep(attribs, (name, value) => {
      if (name === 'title' || name === 'lang') return true;
      if (name === 'dir') return ['ltr', 'rtl', 'auto'].includes(value);
      return false;
    });
    switch (tag) {
      case 'a': {
        const out: Attribs = {};
        if (
          attribs.href !== undefined &&
          isSafeUrl(attribs.href, ['http', 'https', 'mailto'])
        ) {
          out.href = attribs.href;
        }
        Object.assign(out, common);
        if (attribs.class === 'url') out.class = 'url';
        if (attribs.id !== undefined && isFootnoteId(attribs.id)) {
          out.id = attribs.id;
        }
        const footnoteLink =
          out.id !== undefined ||
          (out.href !== undefined && isFootnoteHref(out.href));
        if (footnoteLink && attribs['aria-label'] !== undefined) {
          out['aria-label'] = attribs['aria-label'];
        }
        return out;
      }
      case 'img': {
        const out = { ...common };
        if (attribs.src !== undefined) out.src = attribs.src;
        if (attribs.alt !== undefined) out.alt = attribs.alt;
        if (attribs.width && POSITIVE_INT.test(attribs.width))
          out.width = attribs.width;
        if (attribs.height && POSITIVE_INT.test(attribs.height))
          out.height = attribs.height;
        return out;
      }
      case 'ol': {
        const out = { ...common };
        if (attribs.start !== undefined && INT.test(attribs.start))
          out.start = attribs.start;
        if (attribs.reversed !== undefined) out.reversed = '';
        return out;
      }
      case 'li': {
        const out = { ...common };
        if (attribs.value !== undefined && INT.test(attribs.value))
          out.value = attribs.value;
        if (attribs.id !== undefined && defId?.test(attribs.id))
          out.id = attribs.id;
        return out;
      }
      case 'th':
      case 'td': {
        const out = { ...common };
        if (attribs.colspan && POSITIVE_INT.test(attribs.colspan))
          out.colspan = attribs.colspan;
        if (attribs.rowspan && POSITIVE_INT.test(attribs.rowspan))
          out.rowspan = attribs.rowspan;
        if (['left', 'center', 'right'].includes(attribs.align))
          out.align = attribs.align;
        if (
          tag === 'th' &&
          ['row', 'col', 'rowgroup', 'colgroup'].includes(attribs.scope)
        ) {
          out.scope = attribs.scope;
        }
        return out;
      }
      case 'details': {
        const out = { ...common };
        if (attribs.open !== undefined) out.open = '';
        return out;
      }
      case 'input': {
        if (attribs.type !== 'checkbox') return {};
        const out: Attribs = { type: 'checkbox', disabled: '' };
        if (attribs.checked !== undefined) out.checked = '';
        return out;
      }
      case 'section':
        return attribs.class === 'footnotes'
          ? { ...common, class: 'footnotes' }
          : common;
      case 'span': {
        const out = { ...common };
        if (attribs.class === 'dice-plus') {
          out.class = 'dice-plus';
        } else if (
          attribs.class === 'dice' &&
          attribs.role === 'img' &&
          DICE_SIDES.has(attribs['data-sides']) &&
          POSITIVE_INT.test(attribs['data-value'] ?? '') &&
          DICE_KINDS.has(attribs['data-kind']) &&
          POSITIVE_INT.test(attribs['data-length'] ?? '') &&
          attribs['aria-label'] !== undefined
        ) {
          Object.assign(out, {
            class: 'dice',
            role: 'img',
            'data-sides': attribs['data-sides'],
            'data-value': attribs['data-value'],
            'data-kind': attribs['data-kind'],
            'data-length': attribs['data-length'],
            'aria-label': attribs['aria-label'],
          });
        }
        return out;
      }
      default:
        return common;
    }
  }

  return cleanAttribs;
}

export type SanitizeOptions = {
  /** Footnote identifier namespace admitted by the policy. */
  namespace?: string;
};

export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = {},
): string {
  const cleanAttribs = createPolicy(options.namespace);
  const result = sanitize(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: { a: ['http', 'https', 'mailto'] },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    disallowedTagsMode: 'discard',
    nonTextTags: [...REMOVED_WITH_CONTENT, 'textarea', 'option'],
    transformTags: {
      '*': (tagName, attribs) => {
        if (tagName === 'img') {
          const src = attribs.src;
          if (src === undefined || !isSafeUrl(src, ['http', 'https'])) {
            return { tagName, attribs: { [ALT_MARKER]: attribs.alt ?? '' } };
          }
        }
        return { tagName, attribs: cleanAttribs(tagName, attribs) };
      },
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'input' && frame.attribs.type !== 'checkbox',
  });
  // An image with a rejected source is replaced by its alt text.
  return result.replace(
    new RegExp(`<img ${ALT_MARKER}(?:="([^"]*)")?\\s*/?>`, 'g'),
    (_match, alt: string | undefined) => alt ?? '',
  );
}
