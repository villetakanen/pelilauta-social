/**
 * `pasteHtmlAsMarkdown` only exists wired into a live view — it is a DOM event
 * handler, and CodeMirror dispatches paste events against `contentDOM`. So
 * these tests mount a real editor and dispatch a paste, rather than calling
 * conversion functions directly.
 *
 * jsdom has no `ClipboardEvent`/`DataTransfer` constructors, so a paste is
 * simulated as a plain `Event('paste')` carrying a `clipboardData` object
 * with the `getData` method the handler actually calls. The handler reads
 * only that method, so the simulation exercises its real code path.
 */
import { afterEach, beforeEach, expect, test } from 'vitest';
import { createEditor, type EditorHandle } from '../createEditor';

let target: HTMLDivElement;
let handle: EditorHandle | undefined;

beforeEach(() => {
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  handle?.destroy();
  handle = undefined;
  target.remove();
});

function paste(view: EditorHandle['view'], data: Record<string, string>) {
  const event = new Event('paste', { cancelable: true, bubbles: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: (type: string) => data[type] ?? '' },
  });
  view.contentDOM.dispatchEvent(event);
}

test('pasted HTML lands as markdown', () => {
  handle = createEditor(target, { dark: false, value: '' });
  paste(handle.view, {
    'text/html': '<h1>Title</h1><p><strong>bold</strong></p>',
  });
  expect(handle.getValue()).toBe('# Title\n\n**bold**');
});

test('a pasted script never reaches the document', () => {
  handle = createEditor(target, { dark: false, value: '' });
  paste(handle.view, {
    'text/html': '<script>alert(1)</script><p>safe</p>',
  });
  expect(handle.getValue()).not.toContain('script');
  expect(handle.getValue()).not.toContain('alert');
  expect(handle.getValue()).toContain('safe');
});

test('a paste carrying only text/plain passes through verbatim', () => {
  handle = createEditor(target, { dark: false, value: '' });
  paste(handle.view, { 'text/plain': 'plain, unconverted text' });
  expect(handle.getValue()).toBe('plain, unconverted text');
});

test('a paste replaces the current selection rather than appending', () => {
  handle = createEditor(target, { dark: false, value: 'before AFTER after' });
  const from = 'before '.length;
  const to = from + 'AFTER'.length;
  handle.view.dispatch({ selection: { anchor: from, head: to } });
  paste(handle.view, { 'text/plain': 'MIDDLE' });
  expect(handle.getValue()).toBe('before MIDDLE after');
});
