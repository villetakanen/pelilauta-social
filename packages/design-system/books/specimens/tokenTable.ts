/**
 * Declaration parsing for the TokenTable specimen.
 *
 * A lexicon book lists every token its stylesheet declares, so this parser
 * decides whether the book is correct. It is separate from TokenTable.astro
 * because a component cannot be asserted directly. A dropped declaration renders
 * a shorter table and reports no error, so the parse is covered by tests.
 *
 * Book: apps/design/src/content/components/token-table.mdx
 * Spec: specs/design-system/design-tokens/spec.md
 */

export interface TokenDeclaration {
  /** The custom property name, including the leading `--`. */
  name: string;
  /** The value exactly as declared, with runs of whitespace collapsed. */
  value: string;
  /**
   * The trailing inline comment, when the declaration has one. Stylesheets in
   * this package use it for the resolved length, e.g. `8px`.
   */
  note?: string;
}

export interface TokenFilter {
  /** Exact names to include, in the stylesheet's own order. */
  names?: readonly string[];
  /** Include every declaration whose name starts with this. */
  prefix?: string;
  /**
   * Drop declarations whose name contains this, after the include filter.
   * color-theme.css declares colour roles and box-shadows together and they are
   * presented differently.
   */
  without?: string;
}

interface Comment {
  start: number;
  end: number;
  text: string;
}

/**
 * Replace every comment with spaces of the same length, keeping newlines, so
 * indices into the result still address the original source. Masking rather than
 * deleting lets a trailing comment be matched back to its declaration.
 *
 * Comments are removed before declarations are matched. Stylesheet headers in
 * this package name custom properties in prose, and a pattern run over the raw
 * source would parse those as declarations.
 */
function maskComments(css: string): { masked: string; comments: Comment[] } {
  const comments: Comment[] = [];
  let masked = '';
  let index = 0;

  while (index < css.length) {
    if (css[index] === '/' && css[index + 1] === '*') {
      const closing = css.indexOf('*/', index + 2);
      // An unterminated comment runs to the end of the file, which is what a
      // browser does with it too.
      const bodyEnd = closing === -1 ? css.length : closing;
      const end = closing === -1 ? css.length : closing + 2;

      comments.push({
        start: index,
        end,
        text: css.slice(index + 2, bodyEnd).trim(),
      });

      for (let at = index; at < end; at++) {
        masked += css[at] === '\n' ? '\n' : ' ';
      }
      index = end;
      continue;
    }

    masked += css[index];
    index++;
  }

  return { masked, comments };
}

/**
 * `[^;{}]+` rather than `[^;]+`: stopping at a brace keeps a declaration whose
 * semicolon is missing before a block's end from swallowing the rules after it.
 */
const DECLARATION = /(--[\w-]+)\s*:\s*([^;{}]+);/g;

/** The comment sitting on the same line as a declaration, if there is one. */
function trailingNote(
  masked: string,
  comments: readonly Comment[],
  declarationEnd: number,
): string | undefined {
  const comment = comments.find(({ start }) => start >= declarationEnd);
  if (!comment) return undefined;

  // Only spaces and tabs may separate them. A newline means the comment
  // introduces whatever comes next instead of annotating what came before.
  const between = masked.slice(declarationEnd, comment.start);
  if (!/^[ \t]*$/.test(between)) return undefined;

  return comment.text || undefined;
}

function included(name: string, filter?: TokenFilter): boolean {
  if (!filter) return true;
  if (filter.without && name.includes(filter.without)) return false;
  if (filter.names) return filter.names.includes(name);
  if (filter.prefix) return name.startsWith(filter.prefix);
  return true;
}

/**
 * Every custom-property declaration in `css`, in source order.
 *
 * A filter that matches nothing returns nothing. Callers that require a
 * non-empty result check for it.
 */
export function parseTokens(
  css: string,
  filter?: TokenFilter,
): TokenDeclaration[] {
  const { masked, comments } = maskComments(css);
  const found: TokenDeclaration[] = [];

  for (const match of masked.matchAll(DECLARATION)) {
    const name = match[1];
    if (!included(name, filter)) continue;

    const note = trailingNote(
      masked,
      comments,
      (match.index ?? 0) + match[0].length,
    );

    found.push({
      name,
      value: match[2].replace(/\s+/g, ' ').trim(),
      ...(note ? { note } : {}),
    });
  }

  return found;
}
