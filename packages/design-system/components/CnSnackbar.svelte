<script lang="ts" module>
export type SnackAction = {
  /** The button's label. Localised by the consumer. */
  label: string;
  /** Runs once, when the reader activates the action. */
  callback: () => void;
};

export type Snack = {
  /** What the reader is told. */
  message: string;
  /** What the reader may do about it, if anything. */
  action?: SnackAction;
};

/** How long a snack without an action stands, in milliseconds. */
export const DISPLAY_MS = 5000;

/**
 * The exit transition's length, in milliseconds, and so the delay before the
 * dismissal request. Script cannot read a custom property, so this states
 * `--cn-duration-ui` as a literal; test/cn-snackbar.test.ts pins the two
 * together.
 */
export const EXIT_MS = 220;
</script>

<script lang="ts">
/**
 * CnSnackbar — one report on an operation, at the corner of the view the reader
 * is already in.
 *
 * The component presents the snack in `snack` and nothing else. It holds no
 * queue, reads no browser storage and listens to no document event, so which
 * snack is current is decided outside it and arrives through the prop.
 *
 * Two things end a snack. A snack without an action ends on its own, after
 * DISPLAY_MS. A snack with one ends when the reader takes it — an offer stands
 * until it is taken, because a reader who is being offered something has to be
 * given time to read it. Either way the exit transition runs first and the
 * dismissal request follows it, so a replacement arrives at an empty corner
 * rather than crossfading with what it replaced.
 *
 * The surface is stated here rather than composed from `.elevation-4`. A
 * snackbar's rise is absolute — it stands above whatever it reports on — and the
 * relative nesting in styles/surface.css would demote its shadow according to
 * wherever it happens to be mounted.
 */

let {
  snack,
  onDismiss,
}: {
  /** The current snack, or nothing. */
  snack?: Snack | null;
  /** Requests dismissal, once the exit transition has run. */
  onDismiss?: () => void;
} = $props();

/** Drives the transition: the bar is inserted faded out and raised from here. */
let shown = $state(false);
/** An action runs once. The button reads this as its disabled state. */
let acted = $state(false);
let timer: ReturnType<typeof setTimeout> | undefined;

/*
 * A snack's arrival starts its display period. A replacement therefore gets a
 * full period and a fresh exit of its own, and clearing `snack` while one is
 * leaving cancels the request it was about to make.
 */
$effect(() => {
  const arrived = snack;
  clearTimeout(timer);
  acted = false;
  shown = !!arrived;
  if (arrived && !arrived.action) timer = setTimeout(leave, DISPLAY_MS);
  return () => clearTimeout(timer);
});

/** Runs the exit, then asks for this snack to be let go. */
function leave() {
  clearTimeout(timer);
  shown = false;
  timer = setTimeout(() => onDismiss?.(), EXIT_MS);
}

/**
 * The callback is not ours, so it may throw. The exit runs either way: a snack
 * whose action has already run has nothing left to offer.
 */
function act() {
  if (acted || !snack?.action) return;
  acted = true;
  try {
    snack.action.callback();
  } finally {
    leave();
  }
}
</script>

{#if snack}
  <div class="cn-snackbar" class:shown role="status">
    <span class="message">{snack.message}</span>
    {#if snack.action}
      <button type="button" disabled={acted} onclick={act}>
        {snack.action.label}
      </button>
    {/if}
  </div>
{/if}

<style>
  .cn-snackbar {
    /*
     * Above every layer this design system and Cyan declare, so a report
     * clears whatever it reports on. Private to this component: no other
     * capability may read it (docs/ARCHITECTURE.md).
     */
    --_snackbar-z-index: 60000;

    position: fixed;
    z-index: var(--_snackbar-z-index);
    inset-block-end: var(--cn-grid);
    inset-inline-start: var(--cn-grid);

    display: flex;
    align-items: center;
    gap: var(--cn-gap);
    /* One action row deep, whether or not it carries an action. */
    min-block-size: var(--cn-button-physical-size);
    padding-inline: var(--cn-gap);
    /* A short report, not a paragraph: it gives the view back its width. */
    max-inline-size: min(
      calc(100dvw - var(--cn-grid) * 2),
      calc(var(--cn-grid) * 60)
    );

    border-radius: var(--cn-border-radius);
    background-color: var(--cn-color-surface-4);
    box-shadow: var(--cn-shadow-elevation-4);
    color: var(--cn-color-text-high);

    opacity: 0;
    transition: opacity var(--cn-duration-ui) var(--cn-easing-ui);
    /* The reader reads it and acts on it; a drag selection is neither. */
    user-select: none;
  }

  .cn-snackbar.shown {
    opacity: 1;
  }

  .message {
    font-size: var(--cn-font-size-button);
    font-weight: var(--cn-font-weight-button);
    line-height: var(--cn-line-height-button);
    letter-spacing: var(--cn-letter-spacing-button);
  }

  /*
   * The button is the one styles/buttons.css publishes. Its block margins
   * centre a pill in a seven-unit row, which this bar already is, so they are
   * released, and the padding declared here stands instead.
   */
  .cn-snackbar button {
    flex: none;
    margin-block: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .cn-snackbar {
      transition: none;
    }
  }
</style>
