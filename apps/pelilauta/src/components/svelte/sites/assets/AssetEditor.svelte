<script lang="ts">
import { ASSET_LICENSES_KEYS, type Asset } from 'src/schemas/AssetSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';
import AssetMetadataForm from './AssetMetadataForm.svelte';

interface Props {
  site: Site;
  asset: Asset;
}
const { asset, site }: Props = $props();

const interactive = $derived.by(() => site.owners.includes($uid));
</script>

{#if interactive}
  <AssetMetadataForm {site} {asset}/>
{:else}
  <h4>
    {asset.name}
  </h4>
  <p>
    {asset.description}
  </p>
  {#if !(asset.license === ASSET_LICENSES_KEYS[0])}
    <p>
      <strong>{t(`site:license.${asset.license}`)}</strong>
    </p>
  {/if}
{/if}