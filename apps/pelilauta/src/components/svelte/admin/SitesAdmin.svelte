<script lang="ts">
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

onMount(async () => {
  if (!visible) return;
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
});

function getLatesPageRef(site: Site) {
  if (!site?.pageRefs?.length) return undefined;
  return [...site.pageRefs].sort((a, b) => b.flowTime - a.flowTime)[0];
}
</script>

<WithAuth allow={visible}>
  <div class="content-columns">
    <section>
      <h1>SITES</h1>
      <p>
        Site activity for public and hidden site - used for usage and triage
        purposes.
      </p>
      {#each sites as site}
        <h4>{site.name}</h4>
        <p>
          {getLatesPageRef(site)?.name}
          -
          <ProfileLink uid={getLatesPageRef(site)?.author || ""} />
          -
          {toDisplayString(getLatesPageRef(site)?.flowTime)}
        </p>
        <div class="toolbar">
          <AddSiteReactions {site} />
        </div>
      {/each}
    </section>
  </div>
</WithAuth>
