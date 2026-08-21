import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * The editor is a field, and this is where it says so.
 *
 * `styles/fields.css` states the contract: a filled container closed by an
 * indicator along its block end alone, the indicator carrying every state. The
 * fill rests through hover and moves on focus; the indicator recolours and
 * doubles on both. CodeMirror cannot inherit any of that, because a
 * `.cm-editor` is a div — no element style reaches it — so the field is
 * restated here in the one place a theme can put it.
 *
 * The indicator is an inset box-shadow, not a border, for the reason fields.css
 * gives: a shadow stays out of the box model, so doubling it on focus cannot
 * shift a measurement or reflow a line the reader is in the middle of.
 *
 * Built lazily, and `isDark` is handed in: the factory resolves it against the
 * mount target at construction. A module that read the document to decide
 * would run that read at import time, and the views import this on the server.
 */
export function buildEditorTheme(isDark: boolean) {
  return EditorView.theme(
    {
      '&': {
        inlineSize: '100%',
        blockSize: '100%',
        margin: '0',
        boxSizing: 'border-box',

        /*
         * The field's measurements. The size is `fields.css`'s reading step
         * measured in the mono face, restated rather than referenced: it is a
         * literal there too, and fields.css names the markdown editor as the
         * field that decided it. If it ever becomes a token, this is the second
         * of two places that changes.
         */
        fontFamily: 'var(--cn-font-family-mono)',
        fontSize: '1.0186rem',
        lineHeight: 'var(--cn-line)',

        backgroundColor: 'var(--cn-color-field)',
        border: 'none',
        borderRadius: '0',
        outline: 'none',
        boxShadow:
          'inset 0 calc(-1 * var(--_editor-indicator-width)) 0 0 var(--cn-color-field-border)',

        transition:
          'background-color var(--cn-duration-ui) var(--cn-easing-ui), box-shadow var(--cn-duration-ui) var(--cn-easing-ui)',
      },

      /* Hover moves the indicator alone, and leaves the fill where it rests. */
      '&:hover:not(.cm-focused)': {
        boxShadow:
          'inset 0 calc(-2 * var(--_editor-indicator-width)) 0 0 var(--cn-color-field-border-hover)',
      },

      /*
       * Focus takes the fill as well. `.cm-focused` sits on the same element
       * as `&`, so this is the `:focus-within` the field asks for: the class
       * lands whenever focus is anywhere inside the editor's content.
       */
      '&.cm-focused': {
        backgroundColor: 'var(--cn-color-field-focus)',
        outline: 'none',
        boxShadow:
          'inset 0 calc(-2 * var(--_editor-indicator-width)) 0 0 var(--cn-color-field-border-focus)',
      },

      '.cm-scroller': {
        fontFamily: 'inherit',
        lineHeight: 'inherit',
      },

      /*
       * A field states no foreground colour for the reader's words, so they
       * take the body's. Padding is the field's: a unit and a half of the grid
       * on the block axis, two on the inline.
       */
      '.cm-content': {
        padding: 'calc(var(--cn-grid) * 1.5) calc(var(--cn-grid) * 2)',
        color: 'var(--cn-color-text)',
        /*
         * The field contract names no caret colour. The indicator's focus
         * colour is the field's answer to "where is the reader working",
         * so the caret takes it rather than the generic focus ring.
         */
        caretColor: 'var(--cn-color-field-border-focus)',
      },

      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--cn-color-field-border-focus)',
        borderLeftWidth: '2px',
      },

      /* Italic and the faintest step, as a field's placeholder is. */
      '.cm-placeholder': {
        color: 'var(--cn-color-field-placeholder)',
        fontStyle: 'italic',
      },

      '.cm-selectionBackground, & ::selection': {
        backgroundColor: 'var(--cn-color-selection)',
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: 'var(--cn-color-selection)',
      },

      /*
       * The active line is not a field state, and the field paints nothing for
       * it. Left transparent so the fill is the only thing behind the words.
       */
      '.cm-activeLine': {
        backgroundColor: 'transparent',
      },

      /*
       * The gutter is the page editor's line numbers. It is chrome beside the
       * field rather than part of the fill, so it takes a surface step and
       * closes against the content with the field's resting indicator.
       */
      '.cm-gutters': {
        minInlineSize: 'calc(var(--cn-grid) * 4)',
        backgroundColor: 'var(--cn-color-surface-2)',
        color: 'var(--cn-color-text-low)',
        border: 'none',
        boxShadow:
          'inset calc(-1 * var(--_editor-indicator-width)) 0 0 0 var(--cn-color-field-border)',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 var(--cn-grid)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: 'var(--cn-color-text)',
      },
    },
    { dark: isDark },
  );
}

/**
 * A heading the reader types is the heading the page renders: each takes the
 * design system's text-h class, so typography.css states the step once —
 * size, weight, colour, and the downshift a narrow container asks for. An
 * inline size here would hold the desktop step on a phone while the page
 * around it stepped down.
 *
 * The mono face is the field's, and it stays the face at every step: nothing
 * here changes the family, and the text-h classes state none. Inline code is
 * the one exception in reverse — already mono, so it is marked by a surface
 * behind it instead.
 */
export const markdownHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, class: 'text-h1' },
  { tag: t.heading2, class: 'text-h2' },
  { tag: t.heading3, class: 'text-h3' },
  { tag: t.heading4, class: 'text-h4' },
  {
    tag: t.strong,
    fontWeight: 'var(--cn-font-weight-emphasis)',
    color: 'var(--cn-color-text-high)',
  },
  {
    tag: t.emphasis,
    fontStyle: 'italic',
    color: 'var(--cn-color-text)',
  },
  {
    tag: t.link,
    textDecoration: 'underline',
    color: 'var(--cn-color-link)',
  },
  {
    tag: t.monospace,
    color: 'var(--cn-color-text-high)',
    backgroundColor: 'var(--cn-color-surface-2)',
  },
  {
    tag: t.quote,
    color: 'var(--cn-color-text-low)',
  },
]);
