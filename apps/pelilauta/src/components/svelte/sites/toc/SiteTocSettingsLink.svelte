<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';

/**
 * The Table of contents section used in the SiteApp -microfrontend.
 *
 * @param {Site} site - The site this tray is for.
 *
 * The base-tray visible to anonymoous users is loaded SSR, and all
 * _authz_ requiring components are islands on the client side
 */

interface Props {
  site: Site;
}
const { site }: Props = $props();
const showActions = $derived.by(() => {
  if (site.owners.includes($uid)) return true;
  // if (site.players?.includes($uid)) return true;
  return false;
});
</script>

{#if showActions}
<a class="button" href={`/sites/${site.key}/toc/settings`}>
  <cn-icon noun="tools"></cn-icon>
  <span>{t('site:toc.admin.title')}</span>
</a>
{/if}