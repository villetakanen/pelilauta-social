import { describe, expect, test } from 'vitest';
import { keyboardInset } from '../components/keyboard-inset';

/**
 * The arithmetic chrome publishes as `--cn-keyboard-inset`. It is a function of
 * three figures a browser reports, so it is checked here rather than in a
 * browser; apps/design/e2e asserts that the box shortens by what it publishes.
 */
describe('the keyboard inset', () => {
  test('a browser that shortens its own layout viewport reports nothing', () => {
    // Chromium and Firefox with interactive-widget=resizes-content: both
    // figures shrink together, so there is nothing left for chrome to state.
    expect(
      keyboardInset({ innerHeight: 500, visualHeight: 500, scale: 1 }),
    ).toBe(0);
  });

  test('a shortened visual viewport reports the difference', () => {
    // iOS Safari: the layout viewport stands at 800 while 300 of it is covered.
    expect(
      keyboardInset({ innerHeight: 800, visualHeight: 500, scale: 1 }),
    ).toBe(300);
  });

  test('no keyboard reports nothing', () => {
    expect(
      keyboardInset({ innerHeight: 800, visualHeight: 800, scale: 1 }),
    ).toBe(0);
  });

  test('a zoomed viewport reports nothing', () => {
    // Zoom shortens the visual viewport for a different reason, and a reader
    // who zooms has not opened a keyboard.
    expect(
      keyboardInset({ innerHeight: 800, visualHeight: 320, scale: 2.5 }),
    ).toBe(0);
  });

  test('a visual viewport taller than the layout viewport reports nothing', () => {
    // A browser collapsing its own toolbars reports this transiently, and a
    // negative inset would make the box taller than the viewport.
    expect(
      keyboardInset({ innerHeight: 800, visualHeight: 860, scale: 1 }),
    ).toBe(0);
  });

  test('a fractional viewport rounds to whole pixels', () => {
    expect(
      keyboardInset({ innerHeight: 844.5, visualHeight: 508.2, scale: 1 }),
    ).toBe(336);
  });
});
