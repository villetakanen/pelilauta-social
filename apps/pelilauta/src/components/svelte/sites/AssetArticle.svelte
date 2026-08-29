<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { deleteSiteAsset } from 'src/firebase/client/site/deleteSiteFromAssets';
import type { Asset } from 'src/schemas/AssetSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

type Props = {
  asset: Asset;
  site: Site;
};
const { asset, site }: Props = $props();
const showActions = $derived.by(() => {
  return site.owners.includes($uid);
});

async function deleteAsset() {
  deleteSiteAsset(site, asset);
}
async function copyMarkdown() {
  const markdown = `<img src="${asset.url}" alt="${asset.name}" />`;
  await navigator.clipboard.writeText(markdown);
  pushSnack({
    message: t('site:snacks.copied'),
  });
}
</script>

<article class="asset">
  {#if asset.mimetype?.includes("image")}
    <img src={asset.url} alt={asset.name} />
  {:else if asset.mimetype?.includes("/pdf")}
    <span class="asset-icon"><CnIcon noun="pdf" /></span>
  {:else}
    <span class="asset-icon"><CnIcon noun="assets" /></span>
  {/if}
  <div>
    <p>
      <a href={asset.url} target="_blank">{asset.name}</a>
    </p>
    <p>
      {asset.mimetype}
      {asset.description}
    </p>
  </div>
  <div class="text-end">
    <button
      class="button text"
      onclick={copyMarkdown}
      type="button"
      aria-label={t("actions:copy-markdown")}
      onkeydown={(e) => e.key === "Enter" && copyMarkdown()}
    >
      <CnIcon noun="copy-md" />
    </button>
    {#if showActions}
      <a
        aria-label={t("actions:edit")}
        href={`/sites/${site?.key}/assets/${asset.name}`}
        class="button text"
      >
        <CnIcon noun="edit" />
      </a>
      <button
        class="button text"
        onclick={deleteAsset}
        aria-label={t("actions:delete")}
        onkeydown={(e) => e.key === "Enter" && deleteAsset()}
        type="button"
      >
        <CnIcon noun="delete" />
      </button>
    {/if}
  </div>
</article>

<style>
  .asset {
    display: grid;
    gap: var(--cn-gap);
    grid-template-columns: calc(8 * var(--cn-grid)) 1fr auto;
    align-items: center;
  }
  .asset img {
    max-block-size: calc(8 * var(--cn-grid));
    max-inline-size: 100%;
    justify-self: center;
  }
  .asset-icon {
    justify-self: center;
  }
</style>
