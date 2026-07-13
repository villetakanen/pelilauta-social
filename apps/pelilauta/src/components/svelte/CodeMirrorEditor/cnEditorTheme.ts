import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

export const editorBaseTheme = EditorView.theme(
  {
    // "&" targets the .cm-editor (root) element
    '&': {
      // Sizing and spacing
      width: '100%',
      height: '100%',
      minHeight: 'calc(4 * var(--cn-line))',
      margin: '0',
      boxSizing: 'border-box',

      // Borders with Cyan Design System variables
      border: '0',
      borderBottom: 'var(--cn-input-border)',
      borderRadius: 'var(--cn-input-border-radius)',
      outline: 'none',

      // Background and colors from Cyan Design System
      background: 'var(--color-input, black)',

      // Typography from Cyan Design System
      fontFamily: 'var(--cn-font-family-ui)',
      fontWeight: 'var(--cn-font-weight-ui)',
      fontSize: 'var(--cn-font-size-ui)',
      letterSpacing: 'var(--cn-letter-spacing-ui)',

      // Smooth transitions
      transition:
        'background 0.3s ease, border-color 0.3s ease, border-bottom-color 0.3s ease',
    },

    // Scrollable area
    '.cm-scroller': {
      fontFamily: 'inherit',
      lineHeight: 'var(--cn-line-height-ui)',
    },

    // Content area
    '.cm-content': {
      padding: 'var(--_cn-editor-padding)',
      color: 'var(--color-on-field)',
    },

    // Cursor styling
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--color-caret)',
      borderLeftWidth: '2px',
    },

    // Hover state
    '&:not(.cm-focused):hover': {
      borderBottomColor: 'var(--color-border-hover)',
    },

    // Focus state
    '&.cm-focused': {
      outline: 'none',
      borderBottomColor: 'var(--color-border-focus)',
    },

    // Placeholder text
    '.cm-placeholder': {
      lineHeight: 'var(--cn-line-height-ui)',
      color: 'var(--color-on-field-placeholder)',
    },

    // Selection styling
    '.cm-selectionBackground, & ::selection': {
      background: 'var(--color-selection) !important',
    },

    '&.cm-focused .cm-selectionBackground': {
      background: 'var(--color-selection) !important',
    },

    '&.cm-focused .cm-selectionBackground *': {
      color: 'var(--color-on-selection) !important',
    },

    // Active line
    '.cm-activeLine': {
      borderRadius: '4px',
      backgroundColor: 'transparent',
    },

    // Line numbers gutter
    '.cm-gutters': {
      minWidth: 'calc(2 * var(--cn-gap))',
      backgroundColor:
        'var(--color-elevation-1, var(--background-editor, black))',
      color: 'var(--color-on-button)',
      borderRight: '1px solid var(--color-border, #ddd)',
    },

    // Active line in gutter
    '.cm-gutter.cm-lineNumbers .cm-activeLineGutter': {
      width: '100%',
      backgroundColor:
        'var(--color-elevation-2, var(--background-editor, black))',
    },
    '.cm-activeLineGutter': {
      width: '100%',
      backgroundColor:
        'var(--color-elevation-3, var(--background-editor, black))',
    },

    // Markdown specific
    '& .cm-inline-code': {
      color: 'red',
    },
    '& .cm-quote': {
      backgroundColor: 'var(--color-secondary)',
    },
  },
  { dark: document.body.classList.contains('dark') },
);

export const cnMarkdownHighlightStyle = HighlightStyle.define([
  // Heading styles with Cyan Design System typography
  {
    tag: t.heading1,
    fontSize: 'var(--cn-font-size-h1)',
    fontWeight: 'var(--cn-font-weight-h1)',
    lineHeight: 'var(--cn-line-height-h1)',
    color: 'var(--color-heading-1)',
  },
  {
    tag: t.heading2,
    fontSize: 'var(--cn-font-size-h2)',
    fontWeight: 'var(--cn-font-weight-h2)',
    lineHeight: 'var(--cn-line-height-h2)',
    color: 'var(--color-heading-1)',
  },
  {
    tag: t.heading3,
    fontSize: 'var(--cn-font-size-h3)',
    fontWeight: 'var(--cn-font-weight-h3)',
    lineHeight: 'var(--cn-line-height-h3)',
    color: 'var(--color-heading-2)',
  },
  {
    tag: t.heading4,
    fontSize: 'var(--cn-font-size-h4)',
    fontWeight: 'var(--cn-font-weight-h4)',
    lineHeight: 'var(--cn-line-height-h4)',
    color: 'var(--color-heading-2)',
  },

  // Text styling with Cyan Design System colors
  { tag: t.strong, fontWeight: 'bold', color: 'var(--color-on-code-strong)' },
  {
    tag: t.emphasis,
    fontStyle: 'italic',
    color: 'var(--color-on-code-emphasis)',
  },
  { tag: t.link, textDecoration: 'underline' },
  {
    tag: t.monospace,
    color: 'var(--color-on-code)',
    backgroundColor: 'var(--color-code)',
    fontFamily: 'var(--cn-font-family-mono, monospace)',
  },
  {
    tag: t.quote,
    class: 'cm-quote',
  },
]);
