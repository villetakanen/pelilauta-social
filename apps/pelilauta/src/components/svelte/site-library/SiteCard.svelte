<script lang="ts">
import { generateSrcset, netlifyImage } from '@utils/images/netlifyImage';
import type { Site } from 'src/schemas/SiteSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { systemToNoun } from 'src/utils/schemaHelpers';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
}
const { site }: Props = $props();
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
<cn-card
  title={site.name}
  href={`/sites/${site.key}`}
  noun={systemToNoun(site.system)}
  cover={coverSrc}
  srcset={coverSrcset}
  sizes="(max-width: 768px) 100vw, 450px"
>
  <p>{site.description}</p>
  <div slot="actions" class="toolbar">
    {#if owns()}
      <cn-icon noun="avatar"></cn-icon>
    {/if}
    {#if plays()}
      <cn-icon noun="adventurer"></cn-icon>
    {/if}
    <div>
      <p>{toDisplayString(site.flowTime)}</p>
    </div>
  </div>
</cn-card>