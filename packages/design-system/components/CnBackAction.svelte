<script lang="ts">
/**
 * CnBackAction — a command that closes the modal standing above it. It
 * navigates nothing: no history, no location, no route.
 */
import Icon from './Icon.svelte';

let { label = '<' }: { label?: string } = $props();

let button: HTMLButtonElement;

function back() {
  // Svelte delegates onclick, so the event's currentTarget is not this button.
  button.dispatchEvent(new CustomEvent('cn-back', { bubbles: true }));
}
</script>

<button
  bind:this={button}
  type="button"
  class="chrome-action cn-back-action"
  onclick={back}
>
  <Icon noun="arrow-left" decorative />
  <span>{label}</span>
</button>
