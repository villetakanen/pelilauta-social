import type { MarkedExtension, Tokens } from 'marked';

/**
 * Creates a marked extension that converts compact tabletop-rules dice
 * notation, in prose and link text, into the server-rendered span
 * `specs/dice/spec.md` consumes. It never creates a custom element or a
 * client boundary; see `specs/pelilauta/wiki-dice-notation/spec.md`.
 *
 * Supports:
 * - `dice:<sides>` -> a die span, accessible name `[<sides>]`
 * - `dice:<sides>:<value>` -> a result span, accessible name `[<value>]`
 * - `target:<sides>` and `target:<sides>+` -> an equivalent target span,
 *   accessible name `[d<sides>, <sides>+]`
 * - `target:<sides>:<value>` and `target:<sides>:<value>+` -> an equivalent
 *   target span, accessible name `[d<sides>, <value>+]`
 *
 * @returns A configured `MarkedExtension` object for Dice notation.
 */
export function createDiceExtension(): MarkedExtension {
  const ACCEPTED_SIDES = new Set([2, 4, 6, 8, 10, 12, 20]);

  // Every character the notation itself is built from: ASCII letters and
  // digits carry `dice`/`target`, and Unicode letters, decimal digits,
  // underscore, colon and plus sign are the characters the spec excludes
  // from permitting a token boundary. A contiguous run of these characters
  // is therefore either exactly one accepted notation form, or literal text
  // in full — there is no partial conversion within a run.
  const NON_BOUNDARY_RUN = /^[\p{L}\d_:+]+/u;
  const NON_BOUNDARY_CHAR = /[\p{L}\d_:+]/u;
  const NOTATION_HINT = /(?:dice|target):\d/;

  const DICE_RULE = /^dice:(\d+)(?::(\d+))?$/;
  const TARGET_RULE = /^target:(\d+)(?::(\d+))?(\+)?$/;

  // A raw HTML element's children stay literal. marked tokenizes an inline
  // opening and closing tag as two separate tokens and inline-tokenizes the
  // text between them like ordinary prose, so this extension tracks tag
  // nesting itself and declines to convert while inside an unclosed tag.
  // Depth is keyed per lexer instance: `getMarkedInstance` builds a fresh
  // `Marked` per render, and a nested `lexer.inlineTokens` call (link and
  // wikilink text) reuses that same lexer, so the depth stays consistent
  // across a whole render without leaking into the next one.
  const rawTagDepth = new WeakMap<object, number>();
  const HTML_OPEN_TAG =
    /^<([a-zA-Z][\w-]*)(?:\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?)*\s*(\/)?>/;
  const HTML_CLOSE_TAG = /^<\/[a-zA-Z][\w:-]*\s*>/;
  // HTML void elements have no closing tag and no children, so an ordinary
  // (non-self-closing) `<br>` or `<img src="…">` must not open a literal
  // region that never closes.
  const VOID_ELEMENTS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);

  function isWellFormedNumber(value: string): boolean {
    return /^(0|[1-9]\d*)$/.test(value);
  }

  type DiceToken = Tokens.Generic & {
    sides: string;
    value: string;
    kind: 'die' | 'result' | 'target';
    label: string;
  };

  /**
   * Parses one maximal non-boundary run into a Dice token, or returns
   * `undefined` when the run is not exactly one accepted notation form.
   */
  function parseNotation(run: string): DiceToken | undefined {
    const diceMatch = DICE_RULE.exec(run);
    if (diceMatch) {
      const [, sides, value] = diceMatch;
      if (!isWellFormedNumber(sides) || !ACCEPTED_SIDES.has(Number(sides))) {
        return undefined;
      }
      if (value === undefined) {
        return {
          type: 'dice',
          raw: run,
          sides,
          value: sides,
          kind: 'die',
          label: `[${sides}]`,
        };
      }
      if (
        !isWellFormedNumber(value) ||
        Number(value) < 1 ||
        Number(value) > Number(sides)
      ) {
        return undefined;
      }
      return {
        type: 'dice',
        raw: run,
        sides,
        value,
        kind: 'result',
        label: `[${value}]`,
      };
    }

    const targetMatch = TARGET_RULE.exec(run);
    if (targetMatch) {
      const [, sides, value] = targetMatch;
      if (!isWellFormedNumber(sides) || !ACCEPTED_SIDES.has(Number(sides))) {
        return undefined;
      }
      if (value === undefined) {
        return {
          type: 'dice',
          raw: run,
          sides,
          value: sides,
          kind: 'target',
          label: `[d${sides}, ${sides}+]`,
        };
      }
      if (
        !isWellFormedNumber(value) ||
        Number(value) < 1 ||
        Number(value) > Number(sides)
      ) {
        return undefined;
      }
      return {
        type: 'dice',
        raw: run,
        sides,
        value,
        kind: 'target',
        label: `[d${sides}, ${value}+]`,
      };
    }

    return undefined;
  }

  return {
    extensions: [
      {
        name: 'dice',
        level: 'inline',
        start(src: string): number | undefined {
          const hint = NOTATION_HINT.exec(src);
          if (!hint) return undefined;
          // A marked inline tokenizer cannot look behind: the default text
          // rule would otherwise consume a leading run such as the `x` in
          // `xdice:6` before this extension ever sees it. Reporting the
          // run's start, not the notation's start, keeps the whole run
          // together so the tokenizer below can judge the boundary itself.
          let index = hint.index;
          while (index > 0 && NON_BOUNDARY_CHAR.test(src[index - 1])) {
            index--;
          }
          return index;
        },
        tokenizer(
          this: { lexer: object },
          src: string,
        ): DiceToken | Tokens.Text | undefined {
          // Track raw HTML tag nesting first, on every position, and never
          // consume the tag itself — marked's `tag` rule still creates the
          // `html` token; this only mirrors its boundaries to know when
          // notation sits inside an element's children.
          if (HTML_CLOSE_TAG.test(src)) {
            const depth = rawTagDepth.get(this.lexer) ?? 0;
            rawTagDepth.set(this.lexer, Math.max(0, depth - 1));
            return undefined;
          }
          const openMatch = HTML_OPEN_TAG.exec(src);
          if (openMatch) {
            const [, tagName, selfClosing] = openMatch;
            const isVoid = VOID_ELEMENTS.has(tagName.toLowerCase());
            if (!selfClosing && !isVoid) {
              // Not self-closing and not void: an opening tag whose children
              // are literal.
              const depth = rawTagDepth.get(this.lexer) ?? 0;
              rawTagDepth.set(this.lexer, depth + 1);
            }
            return undefined;
          }
          if ((rawTagDepth.get(this.lexer) ?? 0) > 0) return undefined;

          const runMatch = NON_BOUNDARY_RUN.exec(src);
          if (!runMatch) return undefined;
          const run = runMatch[0];
          if (!NOTATION_HINT.test(run)) return undefined;

          const notation = parseNotation(run);
          if (notation) return notation;

          // The run contains `dice:` or `target:` but is not, in its
          // entirety, one accepted notation form — a leading or trailing
          // character denies the boundary, the side count or value is
          // unsupported, or a number carries a leading zero. It stays text.
          return { type: 'text', raw: run, text: run };
        },
        renderer(token: Tokens.Generic): string {
          const diceToken = token as DiceToken;
          const face =
            diceToken.kind === 'target'
              ? `${diceToken.value}<span class="dice-plus">+</span>`
              : diceToken.value;
          return (
            `<span class="dice" role="img" data-sides="${diceToken.sides}" ` +
            `data-value="${diceToken.value}" data-kind="${diceToken.kind}" ` +
            `data-length="${diceToken.value.length}" ` +
            `aria-label="${diceToken.label}">${face}</span>`
          );
        },
      },
    ],
  };
}
