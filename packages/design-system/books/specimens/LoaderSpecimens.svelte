<script lang="ts">
/** CnLoader book specimens. */
import CnLoader from '../../components/CnLoader.svelte';
import Icon from '../../components/Icon.svelte';

let {
  group,
}: {
  group: 'basic' | 'inline' | 'custom' | 'section' | 'button';
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
  {:else if group === 'button'}
    <div class="row" data-variant="button">
      <button type="button">
        <Icon noun="send" />
        <span>Send</span>
      </button>
      <button type="button" disabled>
        <CnLoader inline noun="send" />
        <span>Send</span>
      </button>
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

  .loader-specimens .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cn-gap);
  }

  .loader-specimens section {
    border: 1px dashed var(--cn-color-border);
    padding: var(--cn-gap);
    inline-size: 100%;
  }
</style>
