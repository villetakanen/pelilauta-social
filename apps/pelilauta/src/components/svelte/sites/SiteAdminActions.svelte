<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
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
          <Icon noun="adventurer" size="xsmall" />
          <span>{t('site:members.title')}</span>
        </a>
      </li>
      <li>
        <a href={`/sites/${site.key}/data`} class="tray-button">
          <Icon noun="import-export" size="xsmall" />
          <span>{t('site:data.title')}</span>
        </a>
      </li>
      <li>
        <a href={`/sites/${site.key}/options`} class="tray-button">
          <Icon noun="tools" size="xsmall" />
          <span>{t('site:options.title')}</span>
        </a>
      </li>
      <li>
        <a href={`/sites/${site.key}/settings`} class="tray-button">
          <Icon noun="tools" size="xsmall" />
          <span>{t('site:settings.title')}</span>
        </a>
      </li>
    </ul>
  </nav>
{:else}
  <div class="flex items-center justify-center p-2" style="opacity:0.11">
    <Icon noun={noun} size="large" />
  </div>
{/if}