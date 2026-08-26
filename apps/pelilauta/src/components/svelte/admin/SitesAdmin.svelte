<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
import {
  SITES_COLLECTION_NAME,
  type Site,
  SiteSchema,
} from 'src/schemas/SiteSchema';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { toClientEntry } from 'src/utils/client/entryUtils';
import { toDisplayString } from 'src/utils/contentHelpers';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';
import ProfileLink from '../app/ProfileLink.svelte';
import WithAuth from '../app/WithAuth.svelte';
import AddSiteReactions from './AddSiteReactions.svelte';

const visible = $derived.by(() => $appMeta.admins.includes($uid));
const sites = $state([] as Site[]);
let isLoading = $state(true);

onMount(async () => {
  if (!visible) return;
  try {
    const { getFirestore, query, collection, orderBy, getDocs } = await import(
      'firebase/firestore'
    );
    const q = query(
      collection(getFirestore(), SITES_COLLECTION_NAME),
      orderBy('flowTime', 'desc'),
    );
    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      sites.push(
        SiteSchema.parse({
          ...toClientEntry(doc.data()),
          key: doc.id,
        }),
      );
    }
  } finally {
    isLoading = false;
  }
});

function getLatesPageRef(site: Site) {
  if (!site?.pageRefs?.length) return undefined;
  return [...site.pageRefs].sort((a, b) => b.flowTime - a.flowTime)[0];
}
</script>

<WithAuth allow={visible}>
  <article class="surface sites-admin-card">
    <header>
      <h1>Sites</h1>
      <p class="text-small text-low">
        Site activity for public and hidden sites — used for usage and triage purposes.
      </p>
    </header>

    {#if isLoading}
      <div class="loading-box">
        <CnLoader />
      </div>
    {:else}
      <div class="sites-admin-list">
        {#each sites as site}
          <div class="site-admin-row">
            <div class="site-info">
              <h3 class="site-name">
                <a href="/sites/{site.key}">{site.name}</a>
              </h3>
              <p class="text-small text-low site-meta">
                {#if getLatesPageRef(site)}
                  <span>Latest: <strong>{getLatesPageRef(site)?.name}</strong></span>
                  <span>•</span>
                  <span><ProfileLink uid={getLatesPageRef(site)?.author || ''} /></span>
                  <span>•</span>
                  <span>{toDisplayString(getLatesPageRef(site)?.flowTime)}</span>
                {:else}
                  <span>No pages published</span>
                {/if}
              </p>
            </div>
            <div class="site-actions">
              <AddSiteReactions {site} />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </article>
</WithAuth>

<style>
  .sites-admin-card {
    display: grid;
    row-gap: var(--cn-line);
  }

  .loading-box {
    display: flex;
    justify-content: center;
    padding-block: var(--cn-line);
  }

  .sites-admin-list {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .site-admin-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--cn-gap);
    padding-block: var(--cn-grid);
    border-block-end: 1px solid var(--cn-color-border);
  }

  .site-admin-row:last-child {
    border-block-end: none;
  }

  .site-info {
    display: grid;
    row-gap: calc(var(--cn-grid) * 0.5);
  }

  .site-name {
    margin: 0;
    font-size: var(--cn-font-size-body);
  }

  .site-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--cn-grid) * 0.5);
    margin: 0;
  }

  .site-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
</style>
