<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { systemToNoun } from 'src/utils/schemaHelpers';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
}

const { site }: Props = $props();
const noun = $derived(systemToNoun(site.system));

const showActions = $derived.by(() => {
  if (site.owners.includes($uid)) return true;
  // if (site.players?.includes($uid)) return true;
  return false;
});
</script>

{#if showActions}
  <nav>
    <ul>
      <li>
        <a href={`/sites/${site.key}/members`} class="tray-button">
          <cn-icon noun="adventurer" xsmall></cn-icon>
          <span>{t('site:members.title')}</span>
        </a>
      </li>
      <li>
        <a href={`/sites/${site.key}/data`} class="tray-button">
          <cn-icon noun="import-export" xsmall></cn-icon>
          <span>{t('site:data.title')}</span>
        </a>
      </li>
      <li>
        <a href={`/sites/${site.key}/options`} class="tray-button">
          <cn-icon noun="tools" xsmall></cn-icon>
          <span>{t('site:options.title')}</span>
        </a>
      </li>
      <li>
        <a href={`/sites/${site.key}/settings`} class="tray-button">
          <cn-icon noun="tools" xsmall></cn-icon>
          <span>{t('site:settings.title')}</span>
        </a>
      </li>
    </ul>
  </nav>
{:else}
  <div class="flex items-center justify-center p-2" style="opacity:0.11">
    <cn-icon noun={noun} large></cn-icon>
  </div>
{/if}