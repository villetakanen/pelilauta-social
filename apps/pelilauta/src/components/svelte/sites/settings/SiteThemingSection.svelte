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

<!--
  The section previews the site's background image, so it breaks out of the
  Prose measure to the container's full width. A breakout starts a row of its
  own, so the sections around it keep the measure.
-->
<section
  class="surface elevation-1 breakout"
  style={previewContainerStyles}>
  <h2>{t('site:settings.theming.title')}</h2>
  
  <SiteCard {site} showPlayerIndicator />

  <SiteThemeImageInput site={site} imageField="backgroundURL" />
  <SiteThemeImageInput site={site} imageField="posterURL" />
  <!--SiteThemeImageInput site={site} imageField="avatarURL" /-->

</section>

<style>
  /* The background spans the breakout; the card and the inputs keep the measure. */
  section {
    display: grid;
    grid-template-columns: min(var(--cn-measure), 100%);
    justify-content: center;
    row-gap: var(--cn-line);
  }
</style>
