/**
 * Same approach as `CnEditor.test.ts`: Svelte 5's `mount`/`unmount`/
 * `flushSync` render the real component into a real jsdom document, and the
 * tests read the resulting DOM rather than a component internal.
 *
 * A `.ts` test cannot author a `{#snippet}` for the `frontmatter` prop, so
 * these mount `fixtures/ShellHarness.svelte` instead — it holds one native
 * title field and re-exports `markClean`/`isDirty`, the shell's exports,
 * so a test reaches them exactly as a consumer route would.
 *
 * jsdom 29 implements `<dialog>`'s `open` attribute but not `showModal`,
 * `show` or `close` — none of the three exist on the prototype. The shell
 * calls `showModal()` and `close()`, so both are stubbed here to flip `open`,
 * which is the one part of the dialog's behaviour these tests need.
 */
import { EditorView } from '@codemirror/view';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, expect, test } from 'vitest';
import ShellHarness from './fixtures/ShellHarness.svelte';

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (): void {
    this.setAttribute('open', '');
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (): void {
    this.removeAttribute('open');
  };
}

let target: HTMLDivElement;
let instance: {
  markClean: () => void;
  isDirty: () => boolean;
} & Record<string, unknown>;

beforeEach(() => {
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  if (instance) unmount(instance);
  instance = undefined as unknown as typeof instance;
  target.remove();
});

function findEditorView(): EditorView {
  const dom = target.querySelector('.cm-editor');
  if (!(dom instanceof HTMLElement)) throw new Error('editor did not mount');
  const view = EditorView.findFromDOM(dom);
  if (!view) throw new Error('no EditorView for the mounted dom');
  return view;
}

function editBody(insert: string): void {
  const view = findEditorView();
  view.dispatch({ changes: { from: view.state.doc.length, insert } });
  flushSync();
}

function titleField(): HTMLInputElement {
  const input = target.querySelector('input[name="title"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('frontmatter field did not mount');
  }
  return input;
}

function editTitle(value: string): void {
  const input = titleField();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/**
 * The bar lives outside the shell, so the test stands in for it with a
 * plain element attached to `document.body` — a sibling of the shell's
 * target, not a descendant — and fires the same bubbling `cn-back` the bar
 * fires. A capture-phase listener on `document` is what the shell installs;
 * a bubble-phase one here stands in for the consumer's handler, which
 * sits further out on the same document.
 */
function dispatchBack(): { consumerSaw: boolean } {
  const bar = document.createElement('div');
  document.body.appendChild(bar);
  let consumerSaw = false;
  const consumerHandler = () => {
    consumerSaw = true;
  };
  document.addEventListener('cn-back', consumerHandler);
  bar.dispatchEvent(new CustomEvent('cn-back', { bubbles: true }));
  flushSync();
  document.removeEventListener('cn-back', consumerHandler);
  bar.remove();
  return { consumerSaw };
}

function confirmDialog(): HTMLDialogElement {
  const dialog = target.querySelector('.cn-editor-shell__confirm');
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new Error('confirm dialog did not mount');
  }
  return dialog;
}

test('a dirty document asks before leaving, and the consumer never sees the back action', () => {
  instance = mount(ShellHarness, { target, props: { value: 'a' } });
  flushSync();
  editBody('b');

  const { consumerSaw } = dispatchBack();

  expect(confirmDialog().open).toBe(true);
  expect(consumerSaw).toBe(false);
});

test('a clean document leaves without asking, and the consumer sees the back action', () => {
  instance = mount(ShellHarness, { target, props: { value: 'a' } });
  flushSync();
  editBody('b');
  instance.markClean();
  flushSync();

  const { consumerSaw } = dispatchBack();

  expect(confirmDialog().open).toBe(false);
  expect(consumerSaw).toBe(true);
});

test('editing the body after markClean makes the document dirty again', () => {
  const seen: boolean[] = [];
  instance = mount(ShellHarness, {
    target,
    props: { value: 'a', onDirtyChange: (dirty: boolean) => seen.push(dirty) },
  });
  flushSync();
  instance.markClean();
  flushSync();
  expect(seen.at(-1)).toBe(false);

  editBody('b');

  expect(seen.at(-1)).toBe(true);
  expect(
    target.querySelector('.cn-editor-shell')?.getAttribute('data-dirty'),
  ).toBe('true');
});

test('editing a slotted frontmatter field dirties the document, and reverting it cleans it', () => {
  instance = mount(ShellHarness, { target, props: { value: 'a' } });
  flushSync();
  instance.markClean();
  flushSync();
  const original = titleField().value;

  editTitle('a new title');
  expect(instance.isDirty()).toBe(true);

  // The shell derives dirty from the difference to the clean point rather
  // than latching a flag on first edit, so undoing the edit clears it too.
  editTitle(original);
  expect(instance.isDirty()).toBe(false);
});

test('confirming departure re-dispatches cn-back with confirmed: true, and the consumer receives it', () => {
  instance = mount(ShellHarness, { target, props: { value: 'a' } });
  flushSync();
  editBody('b');
  dispatchBack();
  expect(confirmDialog().open).toBe(true);

  let seenDetail: { confirmed?: boolean } | undefined;
  const consumerHandler = (event: Event) => {
    seenDetail = (event as CustomEvent<{ confirmed?: boolean }>).detail;
  };
  document.addEventListener('cn-back', consumerHandler);

  const leaveButton = target.querySelector<HTMLButtonElement>(
    '.cn-editor-shell__confirm-actions .cta',
  );
  leaveButton?.click();
  flushSync();

  document.removeEventListener('cn-back', consumerHandler);

  expect(seenDetail?.confirmed).toBe(true);
});

test('a consumer that slots no frontmatter renders no frontmatter region', () => {
  instance = mount(ShellHarness, {
    target,
    props: { value: 'a', withFrontmatter: false },
  });
  flushSync();

  expect(target.querySelector('.cn-editor-shell__frontmatter')).toBeFalsy();
});
