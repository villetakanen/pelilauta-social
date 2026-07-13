<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';

interface Props {
  site: Site;
  selectedPageKey: string;
  setSelectedPageKey: (key: string) => void;
  label: string;
  placeholder?: string;
}
const { site, setSelectedPageKey, selectedPageKey, label, placeholder }: Props =
  $props();

const pageRefsAsOptions = $derived.by(() => {
  if (!site.pageRefs) return [];
  return site.pageRefs.map((pageRef) => {
    return [pageRef.key, pageRef.name];
  });
});
</script>

<label>{label}
  <select
    style="width: 100%;"
    onchange={(e) => setSelectedPageKey((e.target as HTMLSelectElement).value)}
  >
    <option value="">{placeholder || t('site:options.selectPage')}</option>
    {#each pageRefsAsOptions as [key, name]}
      <option
        value={key}
        selected={selectedPageKey === key}
      >{name}</option>
    {/each}
  </select>
</label>
