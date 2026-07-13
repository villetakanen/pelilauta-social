<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { site } from '../../../stores/site';
import AssetArticle from './AssetArticle.svelte';

type Props = {
  site: Site;
};
const { site: ssrSite }: Props = $props();
$site = ssrSite;

const assets = $derived.by(() => {
  return $site.assets || [];
});
</script>

<div class="content-columns">
  <section class="column-l surface p-2">
    <h1>{t('site:assets.title')}</h1>
    <p>{t('site:assets.description')}</p>

    {#each assets as asset}
      <AssetArticle {asset} site={$site}/>
    {/each}
      
  </section>
</div>
