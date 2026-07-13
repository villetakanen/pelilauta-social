import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import DOMPurify from 'dompurify';
import type { Plugin } from 'turndown';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// --- Initialize and configure Turndown ---
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '*',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});
turndownService.use(gfm as Plugin);

export function pasteHtmlAsMarkdown(): Extension {
  return EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return false;
      }

      const pastedHTML = clipboardData.getData('text/html');

      // Handle HTML paste with conversion to Markdown
      if (pastedHTML && pastedHTML.length > 0) {
        event.preventDefault();

        let markdown = '';
        try {
          // Sanitize HTML before conversion for security
          const cleanHTML = DOMPurify.sanitize(pastedHTML, {
            USE_PROFILES: { html: true },
          });
          markdown = turndownService.turndown(cleanHTML);
        } catch (e) {
          console.error('Error during HTML to Markdown conversion:', e);
          // Fallback to plain text if conversion fails
          const pastedText = clipboardData.getData('text/plain');
          if (pastedText && pastedText.length > 0) {
            markdown = pastedText;
          } else {
            return true;
          }
        }

        if (markdown) {
          const { state } = view;
          // Support multiple selections
          const changes = state.selection.ranges.map((range) => ({
            from: range.from,
            to: range.to,
            insert: markdown,
          }));

          view.dispatch({ changes });

          // Dispatch change event for form integration
          view.dom.dispatchEvent(
            new Event('change', { bubbles: true, composed: true }),
          );
        }

        return true; // Event handled
      }

      // Handle plain text paste
      const pastedText = clipboardData.getData('text/plain');
      if (pastedText && pastedText.length > 0) {
        event.preventDefault();
        const { state } = view;
        const changes = state.selection.ranges.map((range) => ({
          from: range.from,
          to: range.to,
          insert: pastedText,
        }));
        view.dispatch({ changes });
        view.dom.dispatchEvent(
          new Event('change', { bubbles: true, composed: true }),
        );
        return true;
      }

      return false; // No clipboard data to handle
    },
  });
}
