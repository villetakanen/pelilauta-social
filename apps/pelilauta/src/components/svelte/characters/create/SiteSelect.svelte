<script lang="ts">
import type { Site } from '@schemas/SiteSchema';
import { uid } from '@stores/session';
import { userSites } from '@stores/userSites';
import { t } from '@utils/i18n';
import { logDebug } from '@utils/logHelpers';

interface Props {
  selected: string;
  setSelected: (siteKey: string, site: Site | null) => void;
}

const { selected, setSelected }: Props = $props();

// Use the userSites store which contains sites the user owns or plays in
const sites = $derived($userSites || []);
const loading = $derived(!$uid); // Loading if no user authenticated

$effect(() => {
  logDebug('SiteSelect', 'Available sites:', sites);
});

// Auto-select site when sites are loaded and selected (sitekey) is prefilled
$effect(() => {
  if (selected && sites.length > 0) {
    const prefillSite = sites.find((site) => site.key === selected);
    if (prefillSite) {
      setSelected(selected, prefillSite);
    }
  }
});

function handleSelectionChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  const selectedKey = select.value;

  if (selectedKey === '') {
    setSelected('', null);
    return;
  }

  const selectedSite = sites.find((site) => site.key === selectedKey) || null;
  setSelected(selectedKey, selectedSite);
}
</script>

<label>
  {t('entries:character.site')}
  <select
    value={setSelected || ''}
    onchange={handleSelectionChange}
    disabled={loading}
  >
    <option value="">{loading ? t('actions:loading') : t('characters:create.noSite')}</option>
    {#each sites as site}
      <option value={site.key}>{site.name}</option>
    {/each}
  </select>
</label>

<p class="downscaled text-low">{t('characters:sites.select.description')}</p>

{#if !loading && sites.length === 0}
  <p class="downscaled text-low">
    {t('characters:sites.select.empty')} 
    <a href="/sites/new">{t('actions:create.site')}</a>
  </p>
{/if}
