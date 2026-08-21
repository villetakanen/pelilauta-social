import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  standardKeymap,
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting } from '@codemirror/language';
import {
  type Compartment,
  EditorState,
  type Extension,
} from '@codemirror/state';
import {
  placeholder as cmPlaceholder,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { buildEditorTheme, markdownHighlightStyle } from './editorTheme';
import { pasteHtmlAsMarkdown } from './pasteHandler';

export interface EditorCallbacks {
  onDocChanged: (doc: string) => void;
  onFocus: (view: EditorView) => void;
}

export interface EditorStateArgs {
  doc: string;
  placeholder: string;
  disabled: boolean;
  gutter: boolean;
  dark: boolean;
  placeholderCompartment: Compartment;
  disabledCompartment: Compartment;
  gutterCompartment: Compartment;
  callbacks: EditorCallbacks;
}

/**
 * The whole extension set, in one place. The three things a consumer can change
 * after mounting sit in compartments so changing them reconfigures the running
 * editor instead of rebuilding its state — which would cost the reader their
 * undo history and their cursor.
 *
 * Markdown is configured with its base language and no `codeLanguages`. Loading
 * `@codemirror/language-data` would pull a grammar for every language a fenced
 * block might name, and the editor is one chunk shared across five views: what
 * it costs, it costs all of them. Fenced blocks highlight as code, not as their
 * language.
 */
export function createEditorState(args: EditorStateArgs): EditorState {
  const extensions: Extension[] = [
    EditorView.lineWrapping,
    keymap.of([
      ...standardKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    highlightSpecialChars(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    markdown({ base: markdownLanguage }),

    args.placeholderCompartment.of(cmPlaceholder(args.placeholder)),
    args.disabledCompartment.of(EditorState.readOnly.of(args.disabled)),
    args.gutterCompartment.of(args.gutter ? lineNumbers() : []),

    pasteHtmlAsMarkdown(),
    syntaxHighlighting(markdownHighlightStyle, { fallback: true }),
    buildEditorTheme(args.dark),

    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        args.callbacks.onDocChanged(update.state.doc.toString());
      }
    }),
    EditorView.domEventHandlers({
      focus: (_event, view) => {
        args.callbacks.onFocus(view);
      },
    }),
  ];

  return EditorState.create({ doc: args.doc, extensions });
}
