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
 * The bar owns one action of its own, the `+` at the row's inline start: what a
 * reader adds to a reply is a menu, and the bar renders the action and the
 * surface while the consumer writes the items. Everything else in the row is
 * the consumer's.
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
import CnMenu from './CnMenu.svelte';

let {
  value = $bindable(''),
  label,
  placeholder = '',
  disabled = false,
  onsend,
  supporting,
  menu,
  menuLabel = 'Add',
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
  /**
   * The commands behind the bar's own `+`: what a reader can add to a reply.
   * The bar renders the action and the surface; the items are the consumer's,
   * one anchor or button each, as CnMenu takes them.
   */
  menu?: Snippet;
  /** The `+` action's accessible name. Localise it, wherever `menu` is given. */
  menuLabel?: string;
  /** Actions at the row's inline start, after the `+`. */
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
      {#if menu || leading}
        <div class="actions" inert={disabled}>
          {#if menu}
            <CnMenu noun="add" chrome opens="block-start" label={menuLabel}>
              {@render menu()}
            </CnMenu>
          {/if}
          {#if leading}{@render leading()}{/if}
        </div>
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
    --_indicator: calc(var(--cn-grid) / 8);
    /*
     * The row the bar stands in before the draft grows it: a supplied action's
     * seven units. Half of it is the radius, so the ends are round at rest and
     * stay that curve at every height the draft reaches.
     */
    --_row: calc(var(--cn-grid) * 7);
    /*
     * The draft's padding, two units above and below the line, moved a quarter
     * unit toward the block start. A reader measures a line by its lowercase,
     * and Roboto Mono reserves four pixels of descent inside the three-unit
     * line: centring the line box puts the lowercase two pixels below the row's
     * centre, and below the two glyphs standing either side of it. The pair
     * still totals four units, so every line the draft grows by lands where it
     * did.
     */
    --_draft-pad-start: calc(var(--cn-grid) * 1.75);
    --_draft-pad-end: calc(var(--cn-grid) * 2.25);

    grid-row: 3;
    overflow: hidden;
    z-index: var(--cn-z-chat-bar);

    /*
     * The bar is the field. It reads the `--cn-color-field*` roles
     * `styles/fields.css` paints a field with, so the surface a reader types
     * into is one surface across the system, and the elevation supplies the
     * shadow and the tier rather than a background. The indicator runs the
     * whole way round, because the bar is a container the reader types into
     * and not a line of a form; it follows whatever radius the band gives.
     *
     * Hover lifts the indicator alone and leaves the fill where it rests, and
     * focus changes the fill as well — the field's states, painted on the whole
     * bar, because the bar reads as one object. The two supplied action regions
     * keep their own hover on top of it.
     */
    background-color: var(--cn-color-field);
    box-shadow: inset 0 0 0 var(--_indicator) var(--cn-color-field-border);

    /*
     * The bar is a field's row, not a surface holding one: `.surface`'s padding
     * would stand outside the input row and carry the bar to eleven units. A
     * supplied action is seven units tall, the draft's line is three with two
     * units of padding above and below it, so the bar stands at seven — the row
     * a field occupies — and grows three at every line. The controls carry their
     * own inset above and below, so the bar adds none there; along the inline
     * edges it adds half a unit, so a control at either end stands off the
     * pill's curve rather than against it.
     */
    padding-block: 0;
    padding-inline: calc(var(--cn-grid) * 0.5);

    /*
     * The draft reads as a field's value: the mono family, at the size and the
     * leading `styles/fields.css` gives a field. Stated here because the value
     * is not published as a token, and stated once, so the mirror below takes
     * the control's metrics by inheritance rather than by a second copy.
     */
    font-family: var(--cn-font-family-mono);
    font-size: 1.0186rem;
    line-height: var(--cn-line);
    transition:
      background-color var(--cn-duration-ui) var(--cn-easing-ui),
      box-shadow var(--cn-duration-ui) var(--cn-easing-ui);

    /*
     * Supporting content takes what it needs and gives it up first; the input
     * row never falls below its controls, and holds the rest. Both tracks
     * resolve against the definite row above, so the field has something
     * definite to fill.
     */
    display: grid;
    grid-template-rows: minmax(0, auto) minmax(min-content, 1fr);
    border-radius: 0;
    color: var(--cn-text-high);
    pointer-events: auto;
  }

  .cn-chat-bar:hover {
    box-shadow: inset 0 0 0 calc(2 * var(--_indicator))
      var(--cn-color-field-border-hover);
  }

  .cn-chat-bar:focus-within {
    background-color: var(--cn-color-field-focus);
    box-shadow: inset 0 0 0 calc(2 * var(--_indicator))
      var(--cn-color-field-border-focus);
  }

  @media (prefers-reduced-motion: reduce) {
    .cn-chat-bar {
      transition: none;
    }
  }

  /*
   * 38.75rem is --cn-breakpoint-small, which a container query cannot read.
   * Past it the bar is an object rather than an edge: inset from the container,
   * centred, no wider than a line of text reads, and a pill. Where it stands and
   * how it grows do not change.
   */
  @container app-chrome (min-width: 38.7501rem) {
    .cn-chat-bar-placement {
      padding: var(--cn-gap);
    }

    /*
     * A pill at rest: the radius is half the resting row, so the ends are as
     * round as the bar is tall at one line. It is a length rather than a
     * proportion, so a draft that grows the bar keeps the same corner instead
     * of stretching it into a lozenge.
     */
    .cn-chat-bar {
      justify-self: center;
      inline-size: 100%;
      max-inline-size: var(--cn-measure);
      border-radius: calc(var(--_row) / 2);
    }
  }

  /*
   * The row is what has to stay reachable, so it never shrinks and the
   * supporting region gives up its space first. `min-block-size: 0` is what
   * lets a flex item scroll rather than push its container open.
   */
  /*
   * The region carries the space it needs, rather than the grid carrying a gap:
   * a gap between tracks stands whether or not the region is rendered, and a bar
   * with no supporting content is a unit taller for it.
   */
  .supporting {
    min-block-size: 0;
    overflow-y: auto;
    padding-block: var(--cn-grid);
    padding-inline: var(--cn-grid);
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
    padding-block: var(--_draft-pad-start) var(--_draft-pad-end);
    padding-inline: var(--cn-grid);
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
    block-size: 100%;
    overflow-y: auto;
    padding-block: var(--_draft-pad-start) var(--_draft-pad-end);
    padding-inline: var(--cn-grid);
    border: none;
    border-radius: 0;
    background: none;
    box-shadow: none;
    font: inherit;
    color: inherit;
    resize: none;
  }

  /*
   * The control stays a hole in the states too: `styles/fields.css` paints a
   * textarea's own hover and focus more specifically than the rule above, so
   * without this a field's indicator draws inside the bar's.
   */
  textarea:hover,
  textarea:focus-within {
    background: none;
    box-shadow: none;
  }

  /*
   * No ring. The bar's own focus state is the focus indication, as it is for
   * every field: a focused text control matches `:focus-visible` whichever way
   * the reader reached it, so a ring meant for the keyboard lands on every
   * click. `specs/design-system/fields/spec.md` carries the reasoning.
   */
  textarea:focus,
  textarea:focus-visible {
    outline: none;
  }

  textarea:disabled {
    opacity: var(--cn-disabled-opacity);
  }
</style>
