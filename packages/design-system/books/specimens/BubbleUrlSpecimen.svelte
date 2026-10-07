<script lang="ts">
import CnBubble from '../../components/CnBubble.svelte';

const url =
  'https://example.org/tabletop/roleplaying/publications/2018-2021/complete-catalogue';
</script>

{#each [false, true] as reply}
  <CnBubble {reply}>
    <div class="content-area">
      <p><a class="url" href={url}>{url}</a></p>
      <p><a href={url}>Read the complete catalogue of tabletop roleplaying publications from 2018 to 2021</a></p>
    </div>
  </CnBubble>
{/each}
