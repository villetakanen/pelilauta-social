<script lang="ts">
import { CnToggleButton } from '@11thdeg/cyan-lit';
import type { Site } from '@schemas/SiteSchema';
import { site, update } from '@stores/site';
import { t } from '@utils/i18n';
import SitePageSelect from '../SitePageSelect.svelte';
import SiteHomepageSelect from './SiteHomepageSelect.svelte';

interface Props {
  site: Site;
}
const { site: initialSite }: Props = $props();
$site = initialSite;

async function setOption(
  option:
    | 'useClocks'
    | 'useHandouts'
    | 'useRecentChanges'
    | 'useSidebar'
    | 'usePlainTextURLs'
    | 'useCharacters'
    | 'useCharacterKeeper',
  value: boolean,
) {
  if (option === 'useCharacters' && value === false) {
    update({ useCharacters: false, useCharacterKeeper: false });
  } else {
    update({ [option]: value });
  }
}

async function setSidebarKey(key: string) {
  update({ sidebarKey: key });
}
</script>

<div class="content-columns">
  <article>
    <h2>{t('site:options.title')}</h2>

    <p class="downscaled">{t('site:options.description')}</p>

    <fieldset>
      <legend>{t('site:options.tools')}</legend>
    <cn-toggle-button 
      label={t('site:options.useClocks')}
      pressed={$site.useClocks || undefined}
      onchange={(e: Event) => setOption('useClocks', (e.target as CnToggleButton).pressed)}
    ></cn-toggle-button>

    <cn-toggle-button 
      label={t('site:options.useHandouts')}
      pressed={$site.useHandouts || undefined}
      onchange={(e: Event) => setOption('useHandouts', (e.target as CnToggleButton).pressed)}
    ></cn-toggle-button>

    <cn-toggle-button 
      label={t('site:options.useCharacters')}
      pressed={$site.useCharacters || undefined}
      onchange={(e: Event) => setOption('useCharacters', (e.target as CnToggleButton).pressed)}
    ></cn-toggle-button>

    {#if $site.useCharacters}
      <cn-toggle-button
        class="nested"
        label={t('site:options.useCharacterKeeper')}
        pressed={$site.useCharacterKeeper || undefined}
        onchange={(e: Event) => setOption('useCharacterKeeper', (e.target as CnToggleButton).pressed)}
      ></cn-toggle-button>
    {/if}

    <cn-toggle-button 
      label={t('site:options.useRecentChanges')}
      pressed={$site.useRecentChanges || undefined}
      onchange={(e: Event) => setOption('useRecentChanges', (e.target as CnToggleButton).pressed)}
    ></cn-toggle-button>
    </fieldset>

    

    <fieldset>
      <legend>{t('site:options.extras')}</legend>

    <cn-toggle-button 
      label={t('entries:site.customPageKeys')}
      pressed={$site.usePlainTextURLs || undefined}
      onchange={(e: Event) => setOption('usePlainTextURLs', (e.target as CnToggleButton).pressed)}
    ></cn-toggle-button>

    <p class="downscaled text-low">{t('site:create.plaintexturls.description')}</p>
    </fieldset>
  </article>
  <section>
    <h2>{t('site:options.navigation.title')}</h2>
    <p class="text-small">
      {t('site:options.navigation.description')}
    </p>

    <fieldset>
      <legend>{t('site:options.sidebar')}</legend>
      <cn-toggle-button 
        label={t('site:options.useSidebar')}
        pressed={$site.useSidebar || undefined}
        onchange={(e: Event) => setOption('useSidebar', (e.target as CnToggleButton).pressed)}
      ></cn-toggle-button>

      {#if $site.useSidebar}
        <SitePageSelect 
          site={$site}
          selectedPageKey={$site.sidebarKey || ''}
          setSelectedPageKey={setSidebarKey}
          label={t('site:options.sidebarPage')}
          placeholder={t('site:options.useDefaultSidebar')}
        />
        <p class="text-small text-low">{t('site:options.sidebarPageDescription')}</p>
      {/if}
    </fieldset>

    <fieldset>
      <legend>{t('site:options.homepage')}</legend>
      <SiteHomepageSelect />
    </fieldset>
  </section>
</div>
