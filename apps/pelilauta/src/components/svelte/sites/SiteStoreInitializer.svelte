<script lang="ts">
import { onMount } from 'svelte';
import type { Site } from '../../../schemas/SiteSchema';
import { isPreSeeded, site } from '../../../stores/site';
import { logDebug } from '../../../utils/logHelpers';

interface Props {
  site: Site;
}
const { site: initialSite }: Props = $props();

// This component's sole purpose is to initialize the store on the client.
onMount(() => {
  // Check if we need to initialize or if it's the same site
  const currentSite = site.get();
  if (isPreSeeded.get() && currentSite?.key === initialSite.key) {
    logDebug(
      'SiteStoreInitializer',
      'Store already seeded for site:',
      initialSite.key,
    );
    return;
  }

  logDebug(
    'SiteStoreInitializer',
    'Seeding site store with SSR data:',
    initialSite.key,
  );
  site.set(initialSite);
  isPreSeeded.set(true);
});

// This component renders nothing to the DOM.
</script>
