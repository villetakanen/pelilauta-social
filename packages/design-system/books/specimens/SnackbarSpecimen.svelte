<script lang="ts">
/**
 * SnackbarSpecimen — a live CnSnackbar bounded in a frame the book can render
 * inline.
 *
 * A snackbar is fixed, so without a containing block it would leave the book
 * and pin itself to the window, and two panes would land on top of each other
 * in the one corner. `.frame` below establishes one: `container-type` makes it
 * both the containing block a fixed descendant resolves against and a stacking
 * context the layer inside it resolves in. So each pane's snackbar sits at that
 * pane's own lower inline-start corner, at the inset the component states.
 *
 * Each pane renders its own colour scheme directly rather than through
 * `Composition`'s `themes` mode, which clones one server-rendered string: this
 * specimen is stateful, and the two panes have to be two instances.
 *
 * Book: apps/design/src/content/components/cn-snackbar.mdx
 */
import CnSnackbar, { type Snack } from '../../components/CnSnackbar.svelte';

let {
  group = 'automatic',
}: {
  /** Which behaviour the pane demonstrates. */
  group?: 'automatic' | 'action' | 'modal';
} = $props();

const MODES = ['light', 'dark'] as const;
type Mode = (typeof MODES)[number];

/** One current snack per pane, which is what a consumer keeps. */
let current = $state<Partial<Record<Mode, Snack>>>({});
/*
 * Counted rather than flagged: an action runs once, and a count is the only
 * reading that tells one activation from two.
 */
let taken = $state(0);

function undo() {
  taken += 1;
}

function raise(mode: Mode) {
  current[mode] =
    group === 'action'
      ? {
          message: 'Sivu poistettu',
          action: { label: 'Kumoa', callback: undo },
        }
      : { message: 'Sivu tallennettu' };
}
</script>

<div class="snackbar-specimen" data-group={group}>
  {#each MODES as mode (mode)}
    <div class="pane" data-mode={mode} style={`color-scheme: ${mode};`}>
      <div class="frame">
        <button type="button" class="raise" onclick={() => raise(mode)}>
          Näytä
        </button>

        {#if group === "modal"}
          <div class="modal-stand-in">Modaali</div>
        {/if}

        {#if group === "action"}
          <p class="text-label" aria-live="polite">Kumottu {taken} kertaa</p>
        {/if}

        <CnSnackbar
          snack={current[mode]}
          onDismiss={() => (current[mode] = undefined)}
        />
      </div>
    </div>
  {/each}
</div>

<style>
  .snackbar-specimen {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }

  .pane {
    color: var(--cn-text);
    background: var(--cn-background);
  }

  .frame {
    /*
     * The containing block and the stacking context the snackbar resolves in.
     * Layout containment is what supplies both; `container-type` alone does
     * not, in Chromium.
     */
    contain: layout;
    block-size: calc(var(--cn-grid) * 24);
    padding: var(--cn-gap);
  }

  .frame p {
    margin: 0;
  }

  /*
   * A stand-in for the modal layer Cyan provides at 50000, so the book shows
   * what the component's own layer is measured against. Test rig, not a system
   * value: no design-system surface declares this.
   */
  .modal-stand-in {
    position: absolute;
    z-index: 50000;
    inset-block-end: 0;
    inset-inline: 0;
    block-size: calc(var(--cn-grid) * 12);
    padding: var(--cn-gap);
    background-color: var(--cn-surface-2);
    color: var(--cn-text-low);
  }
</style>
