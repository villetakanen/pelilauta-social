<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { uid } from '../../../../stores/session';
import { site } from '../../../../stores/site';
import WithAuth from '../../app/WithAuth.svelte';
import SiteDangerZoneSection from './SiteDangerZoneSection.svelte';
import SiteMetaForm from './SiteMetaForm.svelte';
import SiteThemingSection from './SiteThemingSection.svelte';
import SiteTocRegenSection from './SiteTocRegenSection.svelte';

/**
 * A Wrapper for the SiteMembersApp component,
 * Inits the site-store and subscribes to the Site Entry in the Firestore
 */

interface Props {
  site: Site;
}
const { site: initialSite }: Props = $props();
$site = initialSite;
const allow = $derived.by(() => {
  return $site.owners.includes($uid);
});
</script>
<WithAuth {allow}>
  <div class="content-columns">
    <SiteMetaForm site={$site}/>
    <SiteThemingSection site={$site}/>
    <SiteTocRegenSection site={$site}/>
  </div>
  <div class="content-columns">
    <SiteDangerZoneSection site={$site}/>
  </div>
</WithAuth>