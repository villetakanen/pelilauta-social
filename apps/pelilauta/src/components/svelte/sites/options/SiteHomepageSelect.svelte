<script lang="ts">
// This is a child component of SiteOptionsApp.svelte, which sets up the site store
import { site, update } from '@stores/site';
import { pushSnack } from '@utils/client/snackUtils';
import { t } from 'src/utils/i18n';

const pageRefsAsOptions = $derived.by(() => {
  if (!$site?.pageRefs) return [];
  return $site.pageRefs.map((pageRef) => {
    return [pageRef.key, pageRef.name];
  });
});

async function setHomepage(key: string) {
  await update({ homepage: key });
  pushSnack(t('site:settings.meta.saved'));
}
</script>
{#if $site}
<label>{t('entries:site.homePage')}
  <select
    style="width: 100%;"
    onchange={(e) => setHomepage((e.target as HTMLSelectElement).value)}
  >
    {#each pageRefsAsOptions as [key, name]}
      <option
        value={key}
        selected={$site.homepage === key}
      >{name}</option>
    {/each}
  </select>
</label>
<p class="text-small text-low">{t('site:options.homepageDescription')}</p>
{/if}