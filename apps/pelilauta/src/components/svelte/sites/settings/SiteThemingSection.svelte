<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import SiteCard from '../SiteCard.svelte';
import SiteThemeImageInput from './SiteThemeImageInput.svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();

const previewContainerStyles = $derived.by(() => {
  return site.backgroundURL
    ? `background-image: url(${site.backgroundURL});`
    : '';
});
</script>

<section
  class="surface elevation-1 radius-l" 
  style={previewContainerStyles}>
  <h2>{t('site:settings.theming.title')}</h2>
  
  <SiteCard {site} showPlayerIndicator />
  
  <br />

  <SiteThemeImageInput site={site} imageField="backgroundURL" />
  <SiteThemeImageInput site={site} imageField="posterURL" />
  <!--SiteThemeImageInput site={site} imageField="avatarURL" /-->

</section>
