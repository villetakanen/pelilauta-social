<script lang="ts">
import { ASSET_LICENSES_KEYS } from 'src/schemas/AssetSchema';
import { t } from 'src/utils/i18n';

interface Props {
  value: string;
  onchange: (e: Event) => void;
}
const { value, onchange }: Props = $props();
</script>

<label>
  {t('entries:assets.license')}
  <select {value} {onchange}>
    {#each ASSET_LICENSES_KEYS as license}
      <option 
        selected={value === license}
        value={license}>{t(`site:license.${license}`)}</option>
    {/each}
  </select>
</label>