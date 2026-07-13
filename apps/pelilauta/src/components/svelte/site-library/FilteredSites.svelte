<script lang="ts">
import { userSites } from '../../../stores/userSites';
import { filters } from './filters.svelte';
import SiteCard from './SiteCard.svelte';

const filtered = $derived.by(() => {
  const sites = [...$userSites];
  const direction = filters.orderDirection === 'asc' ? 1 : -1;
  return sites.sort((a, b) => {
    if (a[filters.orderBy] < b[filters.orderBy]) return -1 * direction;
    if (a[filters.orderBy] > b[filters.orderBy]) return 1 * direction;
    return 0;
  });
});
</script>

{#each filtered as site (site.key)}
<SiteCard {site}></SiteCard>
{/each}