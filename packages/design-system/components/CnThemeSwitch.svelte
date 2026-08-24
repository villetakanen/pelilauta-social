<script lang="ts">
/**
 * CnThemeSwitch — flips the document's colour scheme between light and dark.
 */
import CnIcon from './CnIcon.svelte';

let { label = 'Switch theme' }: { label?: string } = $props();

let button: HTMLButtonElement;
// Keyed on the count, so a replica remounts and replays on every activation.
let activations = $state(0);

/**
 * Preflight declares `color-scheme: dark light`, and a document with no override
 * of it paints whichever scheme the reader prefers.
 */
function paintedTheme() {
  const root = document.documentElement;
  if (root.style.colorScheme) return root.style.colorScheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function toggle() {
  const root = document.documentElement;
  root.style.colorScheme = paintedTheme() === 'dark' ? 'light' : 'dark';
  activations += 1;
  // Svelte delegates onclick, so the event's currentTarget is not this button.
  button.dispatchEvent(new CustomEvent('cn-theme-change', { bubbles: true }));
}
</script>

<!--
  The replica stays a sibling of the button, never a child: `.chrome-action`'s
  label rule (chrome-actions.css) selects any `> span:not(.cn-icon, .cn-loader)`
  of the button, so a second span nested inside it would be read as the label —
  clipped out of view in compact, laid into the flow in labelled — instead of
  rendering as the burst.
-->
<span class="cn-theme-switch-scope">
  <button
    bind:this={button}
    type="button"
    class="chrome-action cn-theme-switch"
    onclick={toggle}
  >
    <CnIcon noun="moon" decorative />
    <span>{label}</span>
  </button>
  {#key activations}
    {#if activations}
      <span class="burst" aria-hidden="true"><CnIcon noun="moon" decorative /></span>
    {/if}
  {/key}
</span>

<style>
  /* Scoped, so a second switch on the page anchors its own replica. */
  .cn-theme-switch-scope {
    display: inline-flex;
    anchor-scope: --cn-theme-switch;

    /*
     * The switch is icon-only wherever it is mounted, so it declares its own
     * presentation rather than taking the one around it: the label names the
     * control and never shows. This element is the button's parent, which is
     * the element a chrome action's style query reads, so a container further
     * out — an expanded rail, say — cannot label it.
     */
    --cn-chrome-presentation: compact;
  }

  .cn-theme-switch {
    anchor-name: --cn-theme-switch;
  }

  /*
   * A replica of the glyph, expanding out of the button as the scheme lands.
   * The colour is the theme the activation leaves behind: primary's high step
   * screams over Dark, its deep green over Light. Fixed rather than absolute,
   * so a browser without anchor positioning animates it beside the control
   * instead of pushing the layout around.
   */
  .burst {
    position: fixed;
    position-anchor: --cn-theme-switch;
    inset-block-start: anchor(--cn-theme-switch center);
    inset-inline-start: anchor(--cn-theme-switch start);
    pointer-events: none;
    color: light-dark(var(--chroma-primary-40), var(--chroma-primary-90));
    animation: cn-theme-switch-burst calc(var(--cn-duration-ui) * 2)
      var(--cn-easing-ui) forwards;
    /*
     * Centred on the glyph, which sits at the centre of the compact target,
     * `3.5 × --cn-grid` from its inline-start edge. `translate`, not
     * `transform`: the individual transform properties compose outside
     * `scale`, so this offset holds while the keyframes grow the replica about
     * its own centre. From inside `transform`, the ×8 would multiply it too.
     */
    translate: calc(var(--cn-grid) * 3.5 - 50%)
      calc(var(--cn-grid) / 4 - 50%);
  }

  @keyframes cn-theme-switch-burst {
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

  @media (prefers-reduced-motion: reduce) {
    .burst {
      animation: none;
      opacity: 0;
    }
  }
</style>
