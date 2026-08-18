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

<div class="content-prose">
  <article>
    <h2>{t('site:options.title')}</h2>

    <p class="downscaled">{t('site:options.description')}</p>

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
        <p class="text-small text-low">{t('site:options.sidebarPageDescription')}</p>
      {/if}
    </fieldset>

    <fieldset>
      <legend>{t('site:options.homepage')}</legend>
      <SiteHomepageSelect />
    </fieldset>
  </section>
</div>
