<script lang="ts">
/**
 * CnThemeSwitch — flips the document's colour scheme between light and dark.
 *
 * Spec: specs/design-system/components/cn-theme-switch/spec.md
 */
import Icon from './Icon.svelte';

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
  The replica is a sibling anchored to the button, not a child of it: a second
  child would take the control out of the icon-only button presentation and
  resize it mid-interaction.
-->
<span class="cn-theme-switch-scope">
  <button
    bind:this={button}
    type="button"
    class="button text cn-theme-switch"
    aria-label={label}
    onclick={toggle}
  >
    <Icon noun="moon" decorative />
  </button>
  {#key activations}
    {#if activations}
      <span class="burst" aria-hidden="true"><Icon noun="moon" decorative /></span>
    {/if}
  {/key}
</span>

<style>
  /* Scoped, so a second switch on the page anchors its own replica. */
  .cn-theme-switch-scope {
    display: inline-flex;
    anchor-scope: --cn-theme-switch;
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
    position-area: center;
    pointer-events: none;
    color: light-dark(var(--cn-color-primary-40), var(--cn-color-primary-90));
    animation: cn-theme-switch-burst calc(var(--cn-duration-ui) * 2)
      var(--cn-easing-ui) forwards;
    transform: translateY(
      calc(var(--cn-grid) / 4)
    ); /* 2px */
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
