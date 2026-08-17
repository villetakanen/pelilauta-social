<script lang="ts">
/**
 * BackActionSpecimen — a CnBackAction beside a listener mounted above it,
 * so the page can show the bubbling `cn-back` event arriving rather than
 * asserting it happened. The control itself has no visible effect: the
 * count is the only proof an activation occurred.
 *
 * Book: apps/design/src/content/components/cn-back-action.mdx
 */
import CnBackAction from '../../components/CnBackAction.svelte';

let count = $state(0);
let region: HTMLDivElement;

$effect(() => {
  const onBack = () => {
    count += 1;
  };
  region.addEventListener('cn-back', onBack);
  return () => region.removeEventListener('cn-back', onBack);
});
</script>

<div class="back-action-specimen" bind:this={region}>
  <CnBackAction label="Takaisin" />
  <p class="text-label" aria-live="polite">cn-back received: {count}</p>
</div>

<style>
  .back-action-specimen {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
