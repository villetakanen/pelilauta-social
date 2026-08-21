/**
 * Which theme the editor builds when nothing states one.
 *
 * These stub `getComputedStyle` and `matchMedia` rather than styling an element
 * and asking the environment, for two reasons. The first is that jsdom throws
 * on reading `colorScheme` off a computed style at all, so the real code path
 * is unreachable here. The second is that the interesting cases are the ones a
 * document is in after a reader has chosen a theme, and a stub states that
 * directly: `color-scheme: dark light` from preflight settles nothing and hands
 * the decision to the machine, and a single value written onto the root is the
 * reader overriding the machine.
 */
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, test } from 'vitest';
import { createEditor, type EditorHandle } from '../createEditor';

const realComputedStyle = window.getComputedStyle;
const realMatchMedia = window.matchMedia;

let handle: EditorHandle | undefined;

afterEach(() => {
  handle?.destroy();
  handle = undefined;
  window.getComputedStyle = realComputedStyle;
  window.matchMedia = realMatchMedia;
});

/** The document says `scheme`; the machine underneath prefers dark or not. */
function inEnvironment(scheme: string, machinePrefersDark: boolean) {
  window.getComputedStyle = ((element: Element) =>
    ({
      ...realComputedStyle(element),
      colorScheme: scheme,
    }) as CSSStyleDeclaration) as typeof window.getComputedStyle;

  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes('dark') && machinePrefersDark,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  const target = document.createElement('div');
  document.body.appendChild(target);
  handle = createEditor(target, { value: '' });
  return handle.view.state.facet(EditorView.darkTheme);
}

describe('a document that names one scheme', () => {
  test('a forced dark root builds the dark theme, whatever the machine prefers', () => {
    expect(inEnvironment('dark', false)).toBe(true);
  });

  /*
   * The case a check for `dark` alone gets wrong: the reader has asked for
   * light and the machine underneath prefers dark, so falling through to the
   * preference would answer the machine instead of the reader.
   */
  test('a forced light root builds the light theme, whatever the machine prefers', () => {
    expect(inEnvironment('light', true)).toBe(false);
  });
});

describe('a document that names both', () => {
  test('preflight`s `dark light` leaves the decision to the machine', () => {
    expect(inEnvironment('dark light', true)).toBe(true);
    handle?.destroy();
    handle = undefined;
    expect(inEnvironment('dark light', false)).toBe(false);
  });
});

describe('a document that names neither', () => {
  test('`normal` leaves the decision to the machine', () => {
    expect(inEnvironment('normal', true)).toBe(true);
  });
});

describe('a stated option', () => {
  test('wins over everything the document and the machine say', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    window.getComputedStyle = (() => {
      throw new Error(
        'the computed style is not consulted when dark is stated',
      );
    }) as typeof window.getComputedStyle;

    handle = createEditor(target, { value: '', dark: true });
    expect(handle.view.state.facet(EditorView.darkTheme)).toBe(true);
  });
});
