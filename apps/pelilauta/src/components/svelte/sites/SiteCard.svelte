<script lang="ts">
import CnCard from '@design-system/components/CnCard.svelte';
import Icon from '@design-system/components/Icon.svelte';
import { generateSrcset, netlifyImage } from '@utils/images/netlifyImage';
import type { Site } from 'src/schemas/SiteSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { systemToNoun } from 'src/utils/schemaHelpers';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
  showPlayerIndicator?: boolean;
}
const { site, showPlayerIndicator = false }: Props = $props();
const owns = $derived(() => site.owners.includes($uid));
const plays = $derived(() => site.players?.includes($uid));

// Generate optimized image URLs for the site poster
// Cards are 170-450px wide, so we use appropriate sizes
// Only use Netlify CDN in production (not available in local dev)
const isProduction = import.meta.env.PROD;
const coverSrc = $derived.by(() => {
  if (!site.posterURL) return undefined;
  return isProduction
    ? netlifyImage(site.posterURL, { width: 450, format: 'webp', quality: 85 })
    : site.posterURL;
});
const coverSrcset = $derived.by(() => {
  if (!site.posterURL || !isProduction) return undefined;
  return generateSrcset(site.posterURL, [170, 300, 450], {
    format: 'webp',
    quality: 85,
  });
});
</script>

<CnCard
  title={site.name}
  href={`/sites/${site.key}`}
  noun={systemToNoun(site.system)}
  cover={coverSrc}
  srcset={coverSrcset}
  sizes="(max-width: 768px) 100vw, 450px"
  description={site.description}
>
  {#snippet actions()}
    <span class="membership">
      {#if owns()}
        <Icon noun="avatar" size="small" />
      {/if}
      {#if showPlayerIndicator && plays()}
        <Icon noun="adventurer" size="small" />
      {/if}
    </span>
    <p>{toDisplayString(site.flowTime)}</p>
  {/snippet}
</CnCard>

<style>
  .membership {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
  }

</style>
