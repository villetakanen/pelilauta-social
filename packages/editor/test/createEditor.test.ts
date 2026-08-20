/**
 * `createEditor` is the factory's whole contract: mount, read, reconfigure
 * without losing the view, and tear down. Each test below is one claim from
 * that contract, checked against the real `EditorView` rather than a stand-in.
 */
import { EditorView } from '@codemirror/view';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

describe('mounting', () => {
  test('mounts a CodeMirror view into the target with the initial document', () => {
    handle = createEditor(target, { dark: false, value: 'hello world' });
    expect(target.querySelector('.cm-editor')).toBeTruthy();
    expect(handle.getValue()).toBe('hello world');
  });
});

describe('setValue', () => {
  test('changes the document and keeps the same EditorView instance', () => {
    handle = createEditor(target, { dark: false, value: 'first' });
    const view = handle.view;
    handle.setValue('second');
    expect(handle.view).toBe(view);
    expect(handle.getValue()).toBe('second');
  });

  test('dispatches nothing and does not fire onChange when the value already matches', () => {
    const onChange = vi.fn();
    handle = createEditor(target, { dark: false, value: 'same', onChange });
    const dispatchSpy = vi.spyOn(handle.view, 'dispatch');
    handle.setValue('same');
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('collapses the selection when it replaces the document', () => {
    handle = createEditor(target, { dark: false, value: 'first draft' });
    handle.view.dispatch({ selection: { anchor: 2, head: 8 } });
    expect(handle.view.state.selection.main.empty).toBe(false);
    handle.setValue('second draft');
    expect(handle.view.state.selection.main.empty).toBe(true);
  });
});

describe('public surface', () => {
  /*
   * The barrel offers the factory and its types, and nothing that could carry
   * the extension set to a consumer. An export added here reaches every view,
   * so the list is asserted whole.
   */
  test('the barrel exports the factory alone', async () => {
    const barrel = await import('../index');
    expect(Object.keys(barrel).sort()).toEqual(['createEditor']);
  });
});

describe('setDisabled', () => {
  test('flips view.state.readOnly at runtime, in both directions', () => {
    handle = createEditor(target, { dark: false, disabled: false });
    expect(handle.view.state.readOnly).toBe(false);
    handle.setDisabled(true);
    expect(handle.view.state.readOnly).toBe(true);
    handle.setDisabled(false);
    expect(handle.view.state.readOnly).toBe(false);
  });

  test('mirrors aria-disabled onto the host element, and removes it again', () => {
    handle = createEditor(target, { dark: false, disabled: false });
    expect(target.hasAttribute('aria-disabled')).toBe(false);
    handle.setDisabled(true);
    expect(target.getAttribute('aria-disabled')).toBe('true');
    handle.setDisabled(false);
    expect(target.hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('setGutter', () => {
  test('adds and removes .cm-gutters at runtime', () => {
    handle = createEditor(target, { dark: false, gutter: false });
    expect(target.querySelector('.cm-gutters')).toBeFalsy();
    handle.setGutter(true);
    expect(target.querySelector('.cm-gutters')).toBeTruthy();
    handle.setGutter(false);
    expect(target.querySelector('.cm-gutters')).toBeFalsy();
  });
});

describe('destroy', () => {
  test('removes the CodeMirror DOM, is safe to call twice, and leaves other methods inert', () => {
    handle = createEditor(target, { dark: false, value: 'kept' });
    handle.destroy();
    expect(target.querySelector('.cm-editor')).toBeFalsy();

    expect(() => handle?.destroy()).not.toThrow();

    // Every other method is inert rather than throwing, and getValue still
    // answers with the last document the view held.
    expect(() => handle?.setValue('changed')).not.toThrow();
    expect(() => handle?.setPlaceholder('changed')).not.toThrow();
    expect(() => handle?.setDisabled(true)).not.toThrow();
    expect(() => handle?.setGutter(true)).not.toThrow();
    expect(() => handle?.focus()).not.toThrow();
    expect(handle?.getValue()).toBe('kept');
  });
});

describe('callbacks', () => {
  test('onChange fires on a document change', () => {
    const onChange = vi.fn();
    handle = createEditor(target, { dark: false, value: 'a', onChange });
    handle.view.dispatch({ changes: { from: 1, insert: 'b' } });
    expect(onChange).toHaveBeenCalledWith('ab');
  });

  test('onBlur fires only when the document changed while focus was held', () => {
    const onBlur = vi.fn();
    handle = createEditor(target, { dark: false, value: 'a', onBlur });

    // Focus, change the document, blur: the change makes onBlur fire.
    handle.view.contentDOM.dispatchEvent(new FocusEvent('focus'));
    handle.view.dispatch({ changes: { from: 1, insert: 'b' } });
    handle.view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    expect(onBlur).toHaveBeenCalledWith('ab');

    // Focus and blur again with no change in between: onBlur does not fire.
    onBlur.mockClear();
    handle.view.contentDOM.dispatchEvent(new FocusEvent('focus'));
    handle.view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    expect(onBlur).not.toHaveBeenCalled();
  });
});

describe('dark', () => {
  test('a stated dark option wins over the target computed colour scheme', () => {
    target.style.colorScheme = 'light';
    handle = createEditor(target, { dark: true });
    expect(handle.view.state.facet(EditorView.darkTheme)).toBe(true);
  });

  test('a stated light option wins over the target computed colour scheme', () => {
    target.style.colorScheme = 'dark';
    handle = createEditor(target, { dark: false });
    expect(handle.view.state.facet(EditorView.darkTheme)).toBe(false);
  });
});
