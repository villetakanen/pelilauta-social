import { Compartment, EditorState } from '@codemirror/state';
import {
  placeholder as cmPlaceholder,
  EditorView,
  lineNumbers,
} from '@codemirror/view';
import { createEditorState } from './editorConfig';

export interface EditorOptions {
  /** The markdown the reader starts from. */
  value?: string;
  /** What the empty field says. */
  placeholder?: string;
  /** Read-only. The reader sees the document and cannot change it. */
  disabled?: boolean;
  /** Line numbers, for a document long enough to navigate by them. */
  gutter?: boolean;
  /**
   * Which theme variant to build. Resolved from the mount target's computed
   * `color-scheme` when unstated, and read once — a reader switching theme
   * mid-edit is not a case this answers.
   */
  dark?: boolean;
  onChange?: (value: string) => void;
  /** Fires on blur, and only if the document changed while focus was held. */
  onBlur?: (value: string) => void;
}

export interface EditorHandle {
  readonly view: EditorView;
  getValue(): string;
  /** No-op when the document already reads this, so a prefill cannot loop. */
  setValue(next: string): void;
  setPlaceholder(next: string): void;
  setDisabled(next: boolean): void;
  setGutter(next: boolean): void;
  focus(): void;
  /** Idempotent. Every other method is inert afterwards rather than throwing. */
  destroy(): void;
}

/**
 * Which theme to build, asked of the target rather than of the document. A
 * `color-scheme` is inherited, so the mount point answers for wherever it
 * stands — including a subtree that states its own scheme.
 *
 * Both halves of the computed value have to be read, not `dark` alone. Preflight
 * sets `color-scheme: dark light`, which names both and settles nothing, so the
 * browser's preference decides. A reader who has chosen a theme is a root with
 * one of the two written onto it, and either choice has to win — checking only
 * for `dark` would hand a forced-light reader a dark editor whenever the
 * machine underneath preferred dark.
 */
function resolveDark(target: HTMLElement, stated?: boolean): boolean {
  if (typeof stated === 'boolean') return stated;
  const scheme = getComputedStyle(target).colorScheme;
  const namesDark = scheme.includes('dark');
  const namesLight = scheme.includes('light');
  if (namesDark !== namesLight) return namesDark;
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * Mount a markdown editor into `target` and return the handle that drives it.
 *
 * The factory is framework-agnostic on purpose: it holds the configuration, the
 * theme and the paste contract, and a host — `CnEditor.svelte`, an Astro island,
 * a book's specimen — holds only a lifecycle. That split is what lets the
 * config and the theme be tested without a component runtime.
 *
 * This is browser-only, and says so rather than failing obscurely inside
 * CodeMirror. Every module in the package is import-safe on the server; it is
 * the call that needs a document.
 */
export function createEditor(
  target: HTMLElement,
  options: EditorOptions = {},
): EditorHandle {
  if (typeof window === 'undefined') {
    throw new Error('[editor] createEditor needs a browser; call it on mount');
  }

  const placeholderCompartment = new Compartment();
  const disabledCompartment = new Compartment();
  const gutterCompartment = new Compartment();

  let value = options.value ?? '';
  let valueOnFocus = value;
  let destroyed = false;

  /*
   * `disabled` is mirrored to the host so the state is one CSS selector away
   * and assistive technology hears it. CodeMirror's read-only facet is a
   * document rule; it renders nothing and announces nothing.
   */
  const markDisabled = (disabled: boolean) => {
    if (disabled) target.setAttribute('aria-disabled', 'true');
    else target.removeAttribute('aria-disabled');
  };
  markDisabled(options.disabled ?? false);

  const view = new EditorView({
    parent: target,
    state: createEditorState({
      doc: value,
      placeholder: options.placeholder ?? '',
      disabled: options.disabled ?? false,
      gutter: options.gutter ?? false,
      dark: resolveDark(target, options.dark),
      placeholderCompartment,
      disabledCompartment,
      gutterCompartment,
      callbacks: {
        onDocChanged: (doc) => {
          value = doc;
          options.onChange?.(doc);
        },
        onFocus: (focused) => {
          valueOnFocus = focused.state.doc.toString();
        },
      },
    }),
  });

  /*
   * Blur is listened for on the content rather than configured as a DOM
   * handler, because it has to come off again on destroy: a handler baked into
   * the state would outlive the listener list this can clean up.
   */
  const onBlur = () => {
    if (destroyed || valueOnFocus === value) return;
    options.onBlur?.(value);
  };
  view.contentDOM.addEventListener('blur', onBlur);

  return {
    get view() {
      return view;
    },
    getValue: () => value,
    setValue(next) {
      if (destroyed || next === value) return;
      /*
       * The selection is stated, not mapped. Mapped through a whole-document
       * replacement it becomes the whole new document selected backwards, and
       * a reset while focused would hand the next keystroke the entire
       * document to destroy. The start is where a mount-time prefill puts the
       * cursor, so an external write lands the same way.
       */
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
        selection: { anchor: 0 },
      });
    },
    setPlaceholder(next) {
      if (destroyed) return;
      view.dispatch({
        effects: placeholderCompartment.reconfigure(cmPlaceholder(next)),
      });
    },
    setDisabled(next) {
      if (destroyed) return;
      view.dispatch({
        effects: disabledCompartment.reconfigure(EditorState.readOnly.of(next)),
      });
      markDisabled(next);
    },
    setGutter(next) {
      if (destroyed) return;
      view.dispatch({
        effects: gutterCompartment.reconfigure(next ? lineNumbers() : []),
      });
    },
    focus() {
      if (destroyed) return;
      view.focus();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.contentDOM.removeEventListener('blur', onBlur);
      view.destroy();
    },
  };
}
