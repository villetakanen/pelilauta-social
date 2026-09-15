<script lang="ts">
import { handouts } from 'src/stores/site/handouts';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import ProfileLink from '../../app/ProfileLink.svelte';
import HandoutListItem from './HandoutListItem.svelte';
</script>

{#if $handouts.length === 0}
  <p>{t('site:handouts.empty')}</p>
{:else}
  <ul class="handouts-list" role="list">
    {#each $handouts as handout (handout.key)}
      <HandoutListItem {handout} />     
    {/each}
  </ul>
{/if}

<style>
  .handouts-list {
    display: grid;
    row-gap: var(--cn-line);
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
