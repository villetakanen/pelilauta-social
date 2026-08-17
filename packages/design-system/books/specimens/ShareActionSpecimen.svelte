<script lang="ts">
/**
 * ShareActionSpecimen — a CnShareAction beside a listener mounted above it.
 * The control shows nothing itself, and which outcome a reader gets depends on
 * their browser, so the specimen prints the outcome that arrived.
 *
 * Book: apps/design/src/content/base/chrome-actions.mdx
 */
import CnShareAction from '../../components/CnShareAction.svelte';

let outcome = $state('—');
let region: HTMLDivElement;

$effect(() => {
  const onShare = (event: Event) => {
    outcome = (event as CustomEvent<{ outcome: string }>).detail.outcome;
  };
  region.addEventListener('cn-share', onShare);
  return () => region.removeEventListener('cn-share', onShare);
});
</script>

<div class="share-action-specimen" bind:this={region}>
  <CnShareAction label="Jaa" />
  <p class="text-label" aria-live="polite">cn-share outcome: {outcome}</p>
</div>

<style>
  .share-action-specimen {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
