<script lang="ts">
import { handouts } from 'src/stores/site/handouts';
import { toDisplayString } from 'src/utils/contentHelpers';
import ProfileLink from '../../app/ProfileLink.svelte';
import HandoutListItem from './HandoutListItem.svelte';
</script>

<section>

  {#if $handouts.length === 0}
    <p>No handouts available.</p>
  {:else}
    
    {#each $handouts as handout}
      <HandoutListItem {handout} />     
    {/each}
  {/if}
</section>

