<script lang="ts">
import CnToggle from '@design-system/components/CnToggle.svelte';
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
    | 'usePlainTextURLs',
  value: boolean,
) {
  update({ [option]: value });
}

async function setSidebarKey(key: string) {
  update({ sidebarKey: key });
}
</script>

<section class="surface">
  <h2>{t('site:options.title')}</h2>

  <p>{t('site:options.description')}</p>

  <fieldset>
    <legend>{t('site:options.tools')}</legend>
    <CnToggle
      label={t('site:options.useClocks')}
      checked={$site.useClocks ?? false}
      onchange={(e) => setOption('useClocks', e.currentTarget.checked)}
    />

    <CnToggle
      label={t('site:options.useHandouts')}
      checked={$site.useHandouts ?? false}
      onchange={(e) => setOption('useHandouts', e.currentTarget.checked)}
    />

    <CnToggle
      label={t('site:options.useRecentChanges')}
      checked={$site.useRecentChanges ?? false}
      onchange={(e) => setOption('useRecentChanges', e.currentTarget.checked)}
    />
  </fieldset>

  <fieldset>
    <legend>{t('site:options.extras')}</legend>

    <CnToggle
      label={t('entries:site.customPageKeys')}
      checked={$site.usePlainTextURLs ?? false}
      onchange={(e) => setOption('usePlainTextURLs', e.currentTarget.checked)}
    />

    <p>{t('site:create.plaintexturls.description')}</p>
  </fieldset>
</section>

<section class="surface">
  <h2>{t('site:options.navigation.title')}</h2>
  <p>{t('site:options.navigation.description')}</p>

  <fieldset>
    <legend>{t('site:options.sidebar')}</legend>
    <CnToggle
      label={t('site:options.useSidebar')}
      checked={$site.useSidebar ?? false}
      onchange={(e) => setOption('useSidebar', e.currentTarget.checked)}
    />

    {#if $site.useSidebar}
      <SitePageSelect 
        site={$site}
        selectedPageKey={$site.sidebarKey || ''}
        setSelectedPageKey={setSidebarKey}
        label={t('site:options.sidebarPage')}
        placeholder={t('site:options.useDefaultSidebar')}
      />
      <p>{t('site:options.sidebarPageDescription')}</p>
    {/if}
  </fieldset>

  <fieldset>
    <legend>{t('site:options.homepage')}</legend>
    <SiteHomepageSelect />
  </fieldset>
</section>

<style>
  .surface,
  fieldset {
    display: grid;
    row-gap: var(--cn-line);
  }

  fieldset {
    border: none;
    padding: 0;
  }

  legend {
    font-size: var(--cn-font-size-h3);
    font-weight: var(--cn-font-weight-h3);
    line-height: var(--cn-line-height-h3);
    letter-spacing: var(--cn-letter-spacing-h3);
    color: var(--cn-color-text-subheading);
  }
</style>
