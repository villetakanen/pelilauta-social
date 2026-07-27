<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
import { site } from '../../../stores/site';

interface Props {
  site: Site;
}

const { site: initialSite }: Props = $props();
$site = initialSite;
const member = $derived.by(() => {
  if (!$site) return false;
  return $site.owners.includes($uid) || $site.players?.includes($uid);
});
</script>
<nav class="border-t" style="flex: 0 0 auto;">
  <ul>
  {#if $site.useClocks}
    <li>
      <a href={`/sites/${$site.key}/clocks`} class="tray-button">
        <Icon noun="clock" size="xsmall" />
        <span>{t('site:clocks.title')}</span>
      </a>
    </li>
  {/if}
  {#if $site.useHandouts && member}
    <li>
      <a href={`/sites/${$site?.key}/handouts`} class="tray-button">
        <Icon noun="books" size="xsmall" />
        <span>{t('site:handouts.title')}</span>
      </a>
    </li>
  {/if}
  {#if $site.useCharacters }
    <li>
      <a href={`/sites/${$site?.key}/characters`} class="tray-button">
        <Icon noun="adventurer" size="xsmall" />
        <span>{t('site:characters.title')}</span>
      </a>
    </li>
  {/if}
  {#if $site.useCharacters && $site.useCharacterKeeper && member}
    <li>
      <a href={`/sites/${$site?.key}/keeper`} class="tray-button">
        <Icon noun="adventurer" size="xsmall" />
        <span>{t('site:keeper.title')}</span>
      </a>
    </li>
  {/if}
  </ul>
</nav>
          