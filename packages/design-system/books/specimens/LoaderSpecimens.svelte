<script lang="ts">
/** CnLoader book specimens. */
import CnLoader from '../../components/CnLoader.svelte';

let {
  group,
}: {
  group: 'basic' | 'inline' | 'custom' | 'section';
} = $props();
</script>

<div class="loader-specimens" data-loader-group={group}>
  {#if group === 'basic'}
    <div data-variant="basic">
      <CnLoader />
    </div>
  {:else if group === 'inline'}
    <div data-variant="inline">
      <CnLoader inline />
    </div>
  {:else if group === 'custom'}
    <div data-variant="custom">
      <CnLoader noun="cat" label="Loading feline data…" />
    </div>
  {:else if group === 'section'}
    <div data-variant="section">
      <section>
        <CnLoader />
      </section>
    </div>
  {/if}
</div>

<style>
  .loader-specimens {
    display: flex;
    flex-direction: column;
    gap: var(--cn-gap);
    inline-size: 100%;
  }

  .loader-specimens section {
    border: 1px dashed var(--cn-border);
    padding: var(--cn-gap);
    inline-size: 100%;
  }
</style>
