<script lang="ts">
/**
 * CnChatBar — the authoring surface a reader answers a conversation from.
 *
 * The component is one part of application chrome, so it has no standalone
 * placement: its root is a direct child of `CnAppChrome` and every responsive
 * rule below answers the `app-chrome` container rather than the window. v20
 * divided this between `CnChatBar` and `CnReplyAnchor`; the anchor carried no
 * capability of its own, so surface, placement, input and action composition
 * are one component here.
 *
 * It is controlled. The consumer binds `value`, and `onsend` reports a send
 * intent carrying the current value — sending neither clears the value nor
 * unmounts anything, so a failed write keeps the draft on screen. Attachment
 * state, write progress and errors belong to the consumer, which renders them
 * through `supporting`, `leading` and `trailing`.
 *
 * The bar stands at the container's block end and grows toward the block start,
 * stopping at the application bar. It reserves nothing for a virtual keyboard:
 * `CnAppChrome` ends the container above one, so the block end already is the
 * top of the keyboard. v20 pinned the small band below the application bar and
 * grew downward instead, because nothing then measured the keyboard.
 *
 * The ceiling is the grid row the root gives the bar, not a percentage on the
 * bar: it resolves against the `app-chrome` container, so a bounded book
 * composition answers its own frame the way a window-sized chrome does.
 *
 * The field grows by a mirror: an element carrying the same text, never seen,
 * whose height the control then fills. v20 used `field-sizing: content`, which
 * only Chromium implements and which no container can cap — a control sized by
 * its content ignores both a percentage maximum and a stretched line, so the
 * draft would carry the controls out of the bar rather than scroll. The mirror
 * costs the draft twice in the DOM and grows in every browser.
 */
import type { Snippet } from 'svelte';

let {
  value = $bindable(''),
  label,
  placeholder = '',
  disabled = false,
  onsend,
  supporting,
  leading,
  trailing,
}: {
  /** The draft. Bound, so input reaches the consumer as it is typed. */
  value?: string;
  /** The textarea's accessible name. Required, and localised by the consumer. */
  label: string;
  /** The prompt shown while the draft is empty. It does not name the field. */
  placeholder?: string;
  /** Renders the textarea immutable and suppresses every send intent. */
  disabled?: boolean;
  /** Reports a send intent with the current value. */
  onsend?: (value: string) => void;
  /** Context above the input row: an attachment preview, a write error. */
  supporting?: Snippet;
  /** Actions at the row's inline start. */
  leading?: Snippet;
  /** Actions at the row's inline end. */
  trailing?: Snippet;
} = $props();

/**
 * Enter sends; Shift+Enter is the browser's newline and reaches nothing here.
 * A composing reader is mid-word — an IME's Enter commits the candidate — so
 * `isComposing` is the one case where Enter neither sends nor is swallowed.
 */
function keydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  if (disabled || value.trim().length === 0) return;
  onsend?.(value);
}
</script>

<div class="cn-chat-bar-placement">
  <div class="cn-chat-bar surface elevation-3">
    {#if supporting}
      <div class="supporting">{@render supporting()}</div>
    {/if}

    <div class="input-row">
      {#if leading}
        <div class="actions" inert={disabled}>{@render leading()}</div>
      {/if}

      <div class="field">
        <div class="mirror" aria-hidden="true">{`${value}\n`}</div>
        <textarea
          rows="1"
          aria-label={label}
          {placeholder}
          {disabled}
          bind:value
          onkeydown={keydown}
        ></textarea>
      </div>

      {#if trailing}
        <div class="actions" inert={disabled}>{@render trailing()}</div>
      {/if}
    </div>
  </div>
</div>

<style>
  /*
   * The root covers the chrome box and hands the pointer back only where the
   * bar is painted: the document keeps scrolling and answering a press
   * everywhere else.
   *
   * Two rows: the application bar's depth, and everything the bar may take. The
   * ceiling is a track rather than a max on the bar itself, because a
   * percentage max-block-size resolves against an indefinite parent as `none` —
   * the field, sized by its content, would then set the bar's height instead of
   * scrolling inside it. A track measured from this box is definite, so the
   * ceiling holds and the overflow lands where it belongs.
   */
  .cn-chat-bar-placement {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: grid;
    /*
     * The application bar's depth, the slack that pushes the bar to the block
     * end, and the bar's own row. `fit-content` is what makes the ceiling hold:
     * the row is as tall as the bar's content and clamps at what the
     * application bar leaves, and a clamped track is a definite length. A
     * maximum would not be — a percentage against a content-sized box resolves
     * to none, and the field would carry the controls out of the bar.
     */
    grid-template-rows:
      var(--cn-app-bar-height)
      1fr
      fit-content(calc(100% - var(--cn-app-bar-height)));
  }

  /*
   * Small band: the bar stands at the container's block end, spans it, and
   * grows toward the block start with its content until it meets the
   * application bar. Every corner meets an inline edge here, so none is
   * rounded.
   */
  .cn-chat-bar {
    grid-row: 3;
    overflow: hidden;
    z-index: var(--cn-z-chat-bar);

    /*
     * Supporting content takes what it needs and gives it up first; the input
     * row never falls below its controls, and holds the rest. Both tracks
     * resolve against the definite row above, so the field has something
     * definite to fill.
     */
    display: grid;
    grid-template-rows: minmax(0, auto) minmax(min-content, 1fr);
    gap: var(--cn-grid);
    border-radius: 0;
    color: var(--cn-text-high);
    pointer-events: auto;
  }

  /*
   * 38.75rem is --cn-breakpoint-small, which a container query cannot read.
   * Past it the bar is an object rather than an edge: inset from the container,
   * centred, and no wider than a line of text reads. Where it stands and how it
   * grows do not change.
   */
  @container app-chrome (min-width: 38.7501rem) {
    .cn-chat-bar-placement {
      padding: var(--cn-gap);
    }

    .cn-chat-bar {
      justify-self: center;
      inline-size: 100%;
      max-inline-size: var(--cn-measure);
      border-radius: var(--cn-border-radius-large);
    }
  }

  /*
   * The row is what has to stay reachable, so it never shrinks and the
   * supporting region gives up its space first. `min-block-size: 0` is what
   * lets a flex item scroll rather than push its container open.
   */
  .supporting {
    min-block-size: 0;
    overflow-y: auto;
  }

  /*
   * The row yields its own height when the bar is at its cap, so the field
   * scrolls in what remains rather than pushing the row out of the bar. Its
   * controls are flex-none, so what it gives up is the field's space.
   */
  .input-row {
    min-block-size: 0;
    display: flex;
    /*
     * The field takes the row's own block size rather than its content's, which
     * is what makes it scroll once the row has given up space: an item aligned
     * to an edge keeps its content height and would carry the controls out of
     * the bar with it. The controls take the edge for themselves below.
     */
    align-items: stretch;
    /* Three regions that cannot share a line wrap instead of clipping. */
    flex-wrap: wrap;
    gap: var(--cn-grid);
  }

  .actions {
    flex: none;
    /* A control sits at the row's block end, so a grown field rises past it. */
    align-self: flex-end;
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
  }

  .actions[inert] {
    opacity: var(--cn-disabled-opacity);
  }

  /*
   * The field's box: as tall as the mirror below, and shrinking with the row
   * once the bar reaches its ceiling. Its block size is settled by the time the
   * control inside is positioned, which is what gives the control something
   * definite to fill.
   */
  .field {
    position: relative;
    flex: 1;
    min-inline-size: 0;
    min-block-size: 0;
    /*
     * The row's block size, which the grid above settled: the mirror grows the
     * field until the bar's row clamps, and this is where the growth stops. The
     * row wraps when its regions cannot share a line, and a wrapped flex line
     * takes its cross size from content, so the cap is stated here rather than
     * left to alignment.
     */
    max-block-size: 100%;
    overflow: hidden;
  }

  /*
   * The draft, in the control's own metrics, laid out and never seen. The
   * trailing newline the markup adds keeps room for the line being typed, and
   * `pre-wrap` wraps it the way the control does.
   */
  .mirror {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    visibility: hidden;
  }

  /*
   * The control is a hole in the surface, not a box on it: the bar carries the
   * elevation and the radius. It fills the field, so what does not fit scrolls
   * here rather than growing the bar past the application bar.
   */
  textarea {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    overflow-y: auto;
    padding: 0;
    border: none;
    border-radius: 0;
    background: none;
    font: inherit;
    color: inherit;
    resize: none;
  }

  textarea:focus-visible {
    /* An outline, so focus adds no measurement to the row. */
    outline: 2px solid var(--cn-focus-ring);
    outline-offset: 2px;
  }

  textarea:disabled {
    opacity: var(--cn-disabled-opacity);
  }
</style>
