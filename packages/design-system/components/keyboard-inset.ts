/**
 * The depth an on-screen keyboard occupies at the viewport's block end.
 *
 * Where a browser resizes the layout viewport for the keyboard — Chromium and
 * Firefox, given `interactive-widget=resizes-content` — `innerHeight` shrinks
 * with the visual viewport, the two figures agree, and this measures nothing.
 * Where a browser resizes only the visual viewport, which is iOS Safari's
 * behaviour, the difference between them is what the keyboard took.
 *
 * A zoomed visual viewport is shorter for a different reason, so a scaled
 * viewport measures nothing rather than reporting the zoom as a keyboard.
 */
export function keyboardInset(viewport: {
  /** `window.innerHeight`: the layout viewport's block size. */
  innerHeight: number;
  /** `visualViewport.height`: what the reader can currently see. */
  visualHeight: number;
  /** `visualViewport.scale`: 1 while the reader has not zoomed. */
  scale: number;
}): number {
  if (viewport.scale > 1) return 0;
  return Math.max(0, Math.round(viewport.innerHeight - viewport.visualHeight));
}
