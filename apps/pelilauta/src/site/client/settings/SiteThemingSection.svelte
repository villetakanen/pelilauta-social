<script lang="ts">
import SiteCard from '@svelte/sites/SiteCard.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import SiteThemeImageInput from './SiteThemeImageInput.svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();

const frameSrc = $derived.by(() => {
  const v = encodeURIComponent(site.backgroundURL ?? '');
  return `/sites/${site.key}/settings/poster?v=${v}`;
});
</script>

<!--
  The section previews the poster, so it breaks out of the prose measure to
  the container width.
-->
<section class="surface elevation-1 breakout">
  <iframe
    src={frameSrc}
    title={t('site:settings.theming.title')}
    tabindex="-1"
    loading="lazy"
  ></iframe>

  <h2>{t('site:settings.theming.title')}</h2>

  <SiteCard {site} showPlayerIndicator />

  <SiteThemeImageInput site={site} imageField="backgroundURL" />
  <SiteThemeImageInput site={site} imageField="posterURL" />
  <!--SiteThemeImageInput site={site} imageField="avatarURL" /-->

</section>

<style>
  /* The frame is the section's backdrop; the card and the forms keep the measure over it. */
  section {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: min(var(--cn-measure), 100%);
    justify-content: center;
    row-gap: var(--cn-line);
  }

  iframe {
    position: absolute;
    inset: 0;
    z-index: -1;
    inline-size: 100%;
    block-size: 100%;
    border: 0;
    pointer-events: none;
  }
</style>
