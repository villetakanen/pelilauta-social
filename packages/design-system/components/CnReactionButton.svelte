<script lang="ts">
/**
 * CnReactionButton — the love toggle an entry's action row gives the reader.
 *
 * The component holds no state. The consumer supplies the count and the pressed
 * state, receives the native click, and supplies whatever the click changed;
 * until it does, the control keeps showing what it was given. Cyan's
 * `cn-reaction-button` flipped itself and counted on the reader's behalf, and
 * that guesswork — wrong the moment persistence fails — is what the migration
 * retires.
 *
 * The root is one native button, so activation, the keyboard, focus and the
 * disabled state are the platform's. The circular state surface and the count
 * are presentation inside it: one control, one focus stop, one activation
 * wherever the pointer lands. The name is the consumer's `label`, because the
 * heart alone names nothing to a reader who cannot see it; the count's meaning
 * arrives as the accessible description, through `countLabel`.
 *
 * This is its own action presentation. styles/buttons.css excludes
 * `.cn-reaction-button` by selector, the way it excludes every capability with
 * its own geometry and surface.
 *
 * A burst — a replica of the glyph expanding out of the state surface, the
 * theme switch's celebration — plays when the consumer supplies a flipped
 * `pressed`, not on the click: the click is a request, and the landing is what
 * there is to celebrate. Its colour is the state the landing leaves behind.
 */
import CnIcon from './CnIcon.svelte';

let {
  label,
  count,
  countLabel,
  pressed = false,
  disabled = false,
  small = false,
  onclick,
}: {
  /** The toggle's accessible name. Required, and localised by the consumer. */
  label: string;
  /** The reaction count, a non-negative integer. Rendered as given. */
  count: number;
  /** The count's accessible description. Required, and localised by the consumer. */
  countLabel: string;
  /** Whether the current reader's reaction is among the counted. */
  pressed?: boolean;
  /** Renders the control inert: no pointer, no focus, no click. */
  disabled?: boolean;
  /** The compact presentation, for a reply's action row. */
  small?: boolean;
  /** Runs on every activation, with the button as the event's `currentTarget`. */
  onclick: (
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
  ) => void;
} = $props();

const uid = $props.id();
const descriptionId = `${uid}-count`;

// Keyed on the count, so a replica remounts and replays on every landing.
let activations = $state(0);
let previous = pressed;
$effect(() => {
  if (pressed !== previous) {
    previous = pressed;
    activations += 1;
  }
});
</script>

<button
  type="button"
  class="cn-reaction-button"
  class:small
  aria-pressed={pressed}
  aria-label={label}
  aria-describedby={descriptionId}
  {disabled}
  {onclick}
>
  <span class="state-surface" aria-hidden="true">
    <CnIcon noun="love" decorative size="small" />
    {#key activations}
      {#if activations}
        <span class="burst" class:love={pressed}>
          <CnIcon noun="love" decorative size="small" />
        </span>
      {/if}
    {/key}
  </span>
  <span class="count" aria-hidden="true">{count}</span>
  <span class="count-description" id={descriptionId}>{countLabel}</span>
</button>

<style>
  .cn-reaction-button {
    /* Private: the pressed gradient and its burst are this component's only
       consumer, so the love hue stays out of the shared semantic layer. */
    --_love: light-dark(var(--chroma-love-40), var(--chroma-love-60));
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: center;
    /* An action row cannot squeeze the control or stretch it apart. */
    flex: none;
    block-size: calc(var(--cn-line) * 2);
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--cn-color-text-low);
    cursor: pointer;
  }

  .cn-reaction-button.small {
    block-size: calc(var(--cn-line) * 1.5);
  }

  .cn-reaction-button:focus-visible {
    outline: 2px solid var(--cn-color-focus-ring);
    outline-offset: 2px;
  }

  /* The supplied state stays legible beneath the veil; nothing else answers. */
  .cn-reaction-button:disabled {
    opacity: var(--cn-disabled-opacity);
    cursor: not-allowed;
  }

  .state-surface {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    inline-size: calc(var(--cn-line) * 2 - var(--cn-grid) * 0.5);
    block-size: calc(var(--cn-line) * 2 - var(--cn-grid) * 0.5);
    border-radius: 50%;
    background: var(--cn-color-button-text);
    /* A zero-size shadow at rest, so hover spreads the elevation — see
       styles/buttons.css. */
    box-shadow: 0 0 0 var(--cn-shadow-color);
    transition: box-shadow var(--cn-duration-ui) var(--cn-easing-ui);
  }

  .small .state-surface {
    inline-size: calc(var(--cn-line) * 1.5 - var(--cn-grid) * 0.5);
    block-size: calc(var(--cn-line) * 1.5 - var(--cn-grid) * 0.5);
  }

  .cn-reaction-button[aria-pressed='true'] .state-surface {
    background: linear-gradient(
      120deg,
      var(--_love) 11%,
      var(--cn-color-error) 90%
    );
    color: var(--cn-color-surface);
  }

  /*
   * Hover and active wash over whichever surface the state painted, so the
   * pressed gradient stays beneath the feedback: an overlay rather than a
   * replacement.
   */
  .state-surface::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: transparent;
    pointer-events: none;
    transition: background-color var(--cn-duration-ui) var(--cn-easing-ui);
  }

  .cn-reaction-button:enabled:hover .state-surface {
    box-shadow: var(--cn-shadow-button-hover);
  }

  .cn-reaction-button:enabled:hover .state-surface::after {
    background-color: var(--cn-color-hover);
  }

  .cn-reaction-button:enabled:active .state-surface::after {
    background-color: var(--cn-color-active);
  }

  .count {
    padding-inline: var(--cn-grid);
    font-size: var(--cn-font-size-text);
    line-height: var(--cn-line-height-text);
    font-weight: var(--cn-font-weight-text);
    letter-spacing: var(--cn-letter-spacing-text);
    user-select: none;
  }

  .small .count {
    font-size: var(--cn-font-size-caption);
    line-height: var(--cn-line-height-caption);
    font-weight: var(--cn-font-weight-caption);
    letter-spacing: var(--cn-letter-spacing-caption);
  }

  /*
   * The replica, centred on the glyph it copies. The surface clips nothing,
   * so it grows past the control the way the theme switch's burst does.
   */
  .burst {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: var(--chroma-primary-20);
    animation: cn-reaction-burst calc(var(--cn-duration-ui) * 2)
      var(--cn-easing-ui) forwards;
  }

  .burst.love {
    color: var(--_love);
  }

  @keyframes cn-reaction-burst {
    0% {
      scale: 1;
      opacity: 0.9;
    }
    30% {
      opacity: 0.3;
    }
    100% {
      scale: 8;
      opacity: 0;
    }
  }

  /* The description reaches assistive technology and no eye. */
  .count-description {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .state-surface,
    .state-surface::after {
      transition: none;
    }

    .burst {
      animation: none;
      opacity: 0;
    }
  }
</style>
