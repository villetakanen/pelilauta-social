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

// Import custom extensions from existing Lit component
import { cnMarkdownHighlightStyle, editorBaseTheme } from './cnEditorTheme';
import { pasteHtmlAsMarkdown } from './cnPasteHandler';

// Define an interface for the callbacks
interface EditorCallbacks {
  onDocChanged: (newDoc: string) => void;
  onFocus: (event: FocusEvent, view: EditorView) => void;
  onBlur: () => void;
}

export function createEditorState(
  initialDoc: string,
  initialPlaceholder: string,
  initialIsDisabled: boolean,
  initialShowGutter: boolean,
  // Compartments are passed in so the component can manage their reconfiguration
  placeholderCompartment: Compartment,
  disabledCompartment: Compartment,
  gutterCompartment: Compartment,
  callbacks: EditorCallbacks,
): EditorState {
  // Combine all keymaps including Tab handling for indentation
  const allKeymaps = keymap.of([
    ...standardKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    indentWithTab, // Handles Tab and Shift+Tab for indentation
  ]);

  const extensions: Extension[] = [
    // Core editor features
    EditorView.lineWrapping,
    allKeymaps,
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    highlightSpecialChars(),
    highlightActiveLine(),
    highlightActiveLineGutter(),

    // Markdown language support (base only, no fenced code block languages)
    // Avoids importing @codemirror/language-data to keep bundle size small
    markdown({ base: markdownLanguage }),

    // Dynamic configuration via compartments
    placeholderCompartment.of(cmPlaceholder(initialPlaceholder)),
    disabledCompartment.of(EditorState.readOnly.of(initialIsDisabled)),
    gutterCompartment.of(initialShowGutter ? lineNumbers() : []),

    // Custom extensions from Lit component
    pasteHtmlAsMarkdown(), // Turndown plugin with GFM for HTML-to-Markdown paste
    syntaxHighlighting(cnMarkdownHighlightStyle, { fallback: true }),
    editorBaseTheme, // Cyan Design System theming

    // Document change listener
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbacks.onDocChanged(update.state.doc.toString());
      }
    }),

    // Focus/blur event handlers
    EditorView.domEventHandlers({
      focus: callbacks.onFocus,
      blur: () => {
        callbacks.onBlur();
        return false;
      },
    }),

    // Future Phase 3: live markdown rendering decorations
    // liveMarkdownDecorations(),
  ];

  return EditorState.create({
    doc: initialDoc,
    extensions: extensions,
  });
}
