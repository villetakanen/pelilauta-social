import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import DOMPurify from 'dompurify';
import type { Plugin } from 'turndown';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Pasted HTML lands as markdown. A reader copying a passage out of a browser
 * gets its structure — headings, lists, emphasis, tables — rather than a wall
 * of tags, because the document this editor writes is markdown and nothing
 * downstream renders anything else.
 *
 * Sanitising comes before converting, not after: Turndown walks a parsed DOM,
 * so anything it is handed is already live. DOMPurify runs first so a pasted
 * script never reaches that parse.
 *
 * The service is built on first paste rather than at module load, so importing
 * this file on the server constructs nothing.
 */
let service: TurndownService | null = null;

function turndown(): TurndownService {
  if (service) return service;
  service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '*',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });
  service.use(gfm as Plugin);
  return service;
}

/** Replace every selection with one insert, so a multi-cursor paste works. */
function replaceSelections(view: EditorView, insert: string): void {
  view.dispatch({
    changes: view.state.selection.ranges.map((range) => ({
      from: range.from,
      to: range.to,
      insert,
    })),
  });
}

export function pasteHtmlAsMarkdown(): Extension {
  return EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
      const clipboard = event.clipboardData;
      if (!clipboard) return false;

      const html = clipboard.getData('text/html');
      const text = clipboard.getData('text/plain');

      if (html) {
        event.preventDefault();
        let markdown: string;
        try {
          markdown = turndown().turndown(
            DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
          );
        } catch (error) {
          /*
           * A conversion that throws falls back to the plain text the
           * clipboard also carries: the passage survives, without its
           * formatting.
           */
          console.error('[editor] HTML to markdown conversion failed', error);
          markdown = text;
        }
        if (markdown) replaceSelections(view, markdown);
        return true;
      }

      if (text) {
        event.preventDefault();
        replaceSelections(view, text);
        return true;
      }

      return false;
    },
  });
}
