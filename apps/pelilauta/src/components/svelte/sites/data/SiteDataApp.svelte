<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { site } from '../../../../stores/site';
import MembersOnly from '../MembersOnly.svelte';
import ExportAsMdSection from './ExportAsMDSection.svelte';

interface Props {
  site: Site;
}
const { site: initialSite }: Props = $props();
$site = initialSite;
</script>

<div class="content-columns">
  <MembersOnly site={$site}>
    <section class="column-s">
      <h1>{t('site:data.title')}</h1>
      <p class="downscaled text-low">{t('site:data.description')}</p>
    </section>
    <ExportAsMdSection />
    <section class="column-s">
      <a href="/sites/{$site.key}/import" class="button">
      {t('site:import.title')} 
      </a>
    </section>
  </MembersOnly>
</div>