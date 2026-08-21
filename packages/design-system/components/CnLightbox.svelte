<script lang="ts">
/**
 * CnLightbox — a poster's media inside their message, opened full screen.
 *
 * The inline gallery is the whole server response: one figure for a single
 * image, a scrolling strip of square thumbnails for several. Each image is one
 * native button, so activation, the keyboard and focus are the platform's; the
 * caption is never a second focus stop.
 *
 * The full-screen view is a native `<dialog>` opened as a modal, composing
 * Surface's highest system layer rather than painting one. Escape
 * dismissal, focus containment, focus return and the top layer are the
 * platform dialog's — this component adds no document listener, no key
 * handler and no scroll script of its own. Setting `activeIndex` and awaiting
 * a tick before `showModal()` only lets the image reach the dialog's markup
 * before it opens; the await is a microtask, so the opener button is still
 * the focused element when the platform captures it to return focus to later.
 *
 * The dialog's exit control is `CnBackAction`, not a control of its own: every
 * modal and dialog exit in Pelilauta shares one control, so the design system
 * carries no second icon-button presentation for closing something. It
 * dispatches a bubbling `cn-back` and closes nothing itself, so this
 * component listens for it and closes the dialog.
 *
 * `.frame` is excluded from styles/buttons.css by selector, the way
 * `.cn-reaction-button` is, so this component states its whole presentation:
 * a gallery is not a form. The exit control's presentation is
 * styles/chrome-actions.css's; this component only positions it.
 */
import { tick } from 'svelte';
import CnBackAction from './CnBackAction.svelte';

let {
  images,
  openLabel,
  closeLabel,
}: {
  /** The images in presentation order. Empty renders nothing. */
  images: { src: string; caption: string }[];
  /** Localised accessible name for an image control whose caption is empty. */
  openLabel: string;
  /** Localised accessible name for the dialog's close control. */
  closeLabel: string;
} = $props();

let activeIndex = $state<number | null>(null);
let dialog: HTMLDialogElement | undefined = $state();

async function open(index: number) {
  activeIndex = index;
  // Put the active image in the dialog's markup before it opens.
  await tick();
  dialog?.showModal();
}

function closeOnBackdrop(event: MouseEvent) {
  // A click on the backdrop targets the dialog element itself.
  if (event.target === dialog) dialog?.close();
}
</script>

{#if images.length > 0}
  <div class="cn-lightbox elevation-2" class:strip={images.length > 1}>
    {#each images as image, index (image.src + index)}
      <figure class="item">
        <button
          type="button"
          class="frame"
          aria-label={image.caption ? undefined : openLabel}
          onclick={() => open(index)}
        >
          <img src={image.src} alt={image.caption} loading="lazy" />
        </button>
        {#if image.caption}
          <figcaption class="caption">{image.caption}</figcaption>
        {/if}
      </figure>
    {/each}
  </div>
  <dialog
    class="cn-lightbox-dialog elevation-4"
    bind:this={dialog}
    onclose={() => (activeIndex = null)}
    onclick={closeOnBackdrop}
    oncn-back={() => dialog?.close()}
  >
    <CnBackAction label={closeLabel} />
    {#if activeIndex !== null}
      <img
        class="whole"
        src={images[activeIndex].src}
        alt={images[activeIndex].caption}
      />
    {/if}
  </dialog>
{/if}

<style>
  .cn-lightbox {
    /*
     * Private, and deliberately scheme-independent: an overlaid caption has to
     * stay readable over any artwork in Light and Dark alike. v20 painted it
     * from the theme foreground, which fails over light artwork in Light — do
     * not copy that. It stays on the gallery, because the gallery holds the only
     * thing that sits on artwork; the dialog's contents sit on a surface.
     */
    --_scrim: color-mix(in oklch, var(--chroma-surface-10) 80%, transparent);
    --_on-scrim: var(--chroma-surface-99);
    color: var(--cn-color-text);
    padding: var(--cn-grid);
    border-radius: var(--cn-border-radius);
  }

  /* Single image: the figure carries the caption below it, not overlaid. */
  .cn-lightbox:not(.strip) .item img {
    aspect-ratio: 16 / 9;
    object-fit: cover;
    inline-size: 100%;
  }

  /* Several images: a 16:9 strip the reader scrolls on the inline axis. */
  .cn-lightbox.strip {
    display: flex;
    flex-flow: row nowrap;
    align-items: stretch;
    gap: var(--cn-grid);
    aspect-ratio: 16 / 9;
    overflow-x: auto;
    /*
     * Signals off-screen thumbnails without moving anything or intercepting
     * the scroll — the platform still owns it.
     */
    mask-image: linear-gradient(
      to right,
      black calc(100% - var(--cn-grid) * 4),
      transparent 100%
    );
  }

  .cn-lightbox.strip .item {
    position: relative;
    flex: none;
    block-size: 100%;
    aspect-ratio: 1;
  }

  .cn-lightbox.strip .item img {
    block-size: 100%;
    inline-size: 100%;
    object-fit: cover;
  }

  .item {
    margin: 0;
  }

  .item img {
    border-radius: var(--cn-border-radius-small);
  }

  /* The overlaid thumbnail caption sits on the private scrim, over artwork. */
  .cn-lightbox.strip .caption {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    margin: 0;
    padding: calc(var(--cn-grid) * 0.5) var(--cn-grid);
    background: var(--_scrim);
    color: var(--_on-scrim);
    border-radius: 0 0 var(--cn-border-radius-small) var(--cn-border-radius-small);
  }

  .caption {
    font-size: var(--cn-font-size-caption);
    line-height: var(--cn-line-height-caption);
    font-weight: var(--cn-font-weight-caption);
    letter-spacing: var(--cn-letter-spacing-caption);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .frame {
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    color: inherit;
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  .frame:focus-visible {
    outline: 2px solid var(--cn-color-focus-ring);
  }

  /*
   * The ring turns inward in the strip: it scrolls edge to edge, so an
   * outset ring on the first or last thumbnail would sit partly outside the
   * scrollable box and inside the trailing mask's fade. The single-image
   * frame sits inside the gallery's padding, so its outset ring above
   * stays clear of any edge.
   */
  .cn-lightbox.strip .frame:focus-visible {
    outline-offset: -2px;
  }

  /*
   * The full-screen view is the highest system layer, so it composes
   * `.elevation-4` for its surface colour and shadow (styles/surface.css) and
   * paints neither itself. It composes `.elevation-4` alone and not `.surface`:
   * a surface is an inline-size query container, and inline-size containment
   * computes a box's inline size as though it had no contents, which collapses a
   * `fit-content` dialog to its own padding and takes the image down with it. So
   * the inset here is this component's, where a padded container would otherwise
   * have been Surface's. Surface states no foreground either way, so the dialog
   * states its own.
   *
   * Standing the exit control on that surface rather than over artwork is what
   * keeps it simple: it takes --cn-color-hover, --cn-color-active and --cn-color-focus-ring exactly
   * as styles/chrome-actions.css declares them, so nothing here recolours it, and
   * the private scrim above stays with the one thing that does sit on artwork.
   *
   * The centring and the intrinsic sizing are the UA dialog stylesheet's, and
   * both are restated because the design system removes them. `margin: auto`
   * against a zero inset is what centres a modal dialog in the viewport, and
   * styles/preflight.css zeroes the margin of every element — without that line
   * the dialog sits in the block-start, inline-start corner. `fit-content` is
   * restated for the same reason: what the UA gives a dialog cannot be assumed
   * to survive the reset.
   */
  .cn-lightbox-dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    inline-size: fit-content;
    block-size: fit-content;
    max-inline-size: 90dvw;
    max-block-size: 90dvh;
    padding: var(--cn-gap);
    border: none;
    color: var(--cn-color-on-surface);
  }

  .cn-lightbox-dialog::backdrop {
    background: var(--cn-color-scrim);
  }

  /* Whole, never cropped, inside whatever the surface's inset leaves it. */
  .whole {
    display: block;
    object-fit: contain;
    max-inline-size: 100%;
    max-block-size: 100%;
  }

  /* Back stands at the start of what it exits, the corner the arrow-left glyph points to. */
  :global(.cn-lightbox-dialog .cn-back-action) {
    position: absolute;
    inset-block-start: var(--cn-grid);
    inset-inline-start: var(--cn-grid);
  }

  /* Nothing here animates, so prefers-reduced-motion has nothing to honour. */
</style>
