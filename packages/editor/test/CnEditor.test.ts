/**
 * The Svelte host's whole job is the lifecycle around the factory: mount,
 * sync four props onto the handle, destroy. `@testing-library/svelte` is not
 * installed and this suite does not add it — Svelte 5 ships its own `mount`,
 * `unmount` and `flushSync`, which is enough to render the real component and
 * read its real DOM, so that is what these tests use.
 *
 * The mounted view is recovered with `EditorView.findFromDOM` rather than a
 * component internal, because the handle itself is private to the component
 * — the same boundary the factory tests respect for `createEditor`.
 */
import { EditorView } from '@codemirror/view';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, expect, test } from 'vitest';
import CnEditor from '../CnEditor.svelte';

let target: HTMLDivElement;
/*
 * What `mount` returns is the component's exports, and this component declares
 * none — so the only thing a test does with the value is hand it back to
 * `unmount`. Typed as the record that describes it rather than as `any`.
 */
let instance: Record<string, never> | undefined;

beforeEach(() => {
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  if (instance) unmount(instance);
  instance = undefined;
  target.remove();
});

function findView(): EditorView {
  const dom = target.querySelector('.cm-editor');
  if (!(dom instanceof HTMLElement)) throw new Error('editor did not mount');
  const view = EditorView.findFromDOM(dom);
  if (!view) throw new Error('no EditorView for the mounted dom');
  return view;
}

test('mounts the editor with the initial value', () => {
  instance = mount(CnEditor, {
    target,
    props: { value: 'starting text', dark: false },
  });
  flushSync();
  expect(findView().state.doc.toString()).toBe('starting text');
});

test('renders a hidden input carrying the value only when name is given', () => {
  instance = mount(CnEditor, {
    target,
    props: { value: 'a', dark: false },
  });
  flushSync();
  expect(target.querySelector('input[type="hidden"]')).toBeFalsy();
  unmount(instance);

  instance = mount(CnEditor, {
    target,
    props: { value: 'a', dark: false, name: 'body' },
  });
  flushSync();
  const input = target.querySelector('input[type="hidden"]');
  expect(input).toBeInstanceOf(HTMLInputElement);
  expect((input as HTMLInputElement).name).toBe('body');
  expect((input as HTMLInputElement).value).toBe('a');
});

test('the disabled prop reaches the mounted view and the host element', () => {
  instance = mount(CnEditor, {
    target,
    props: { value: '', dark: false, disabled: true },
  });
  flushSync();
  expect(findView().state.readOnly).toBe(true);
  expect(
    target.querySelector('.cn-editor')?.getAttribute('aria-disabled'),
  ).toBe('true');
});

test('the gutter prop reaches the mounted view', () => {
  instance = mount(CnEditor, {
    target,
    props: { value: '', dark: false, gutter: true },
  });
  flushSync();
  expect(target.querySelector('.cm-gutters')).toBeTruthy();
});

test('destroying the component removes the CodeMirror DOM', () => {
  instance = mount(CnEditor, { target, props: { value: '', dark: false } });
  flushSync();
  expect(target.querySelector('.cm-editor')).toBeTruthy();
  unmount(instance);
  instance = undefined;
  expect(target.querySelector('.cm-editor')).toBeFalsy();
});

test('a document change made on the underlying view fires onChange with the new value', () => {
  let seen: string | undefined;
  instance = mount(CnEditor, {
    target,
    props: {
      value: 'a',
      dark: false,
      onChange: (next: string) => {
        seen = next;
      },
    },
  });
  flushSync();
  findView().dispatch({ changes: { from: 1, insert: 'b' } });
  flushSync();
  expect(seen).toBe('ab');
});
