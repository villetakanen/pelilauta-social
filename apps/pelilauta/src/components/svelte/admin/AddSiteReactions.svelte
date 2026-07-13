<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { onMount } from 'svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();
let exists = $state(false);
let loaded = $state(false);

onMount(async () => {
  const { getFirestore, doc, getDoc } = await import('firebase/firestore');
  const reactionsDoc = await getDoc(
    doc(getFirestore(), `reactions/${site.key}`),
  );
  if (reactionsDoc.exists()) {
    exists = true;
  }
  loaded = true;
});

const addReactions = async () => {
  const { getFirestore, doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(getFirestore(), `reactions/${site.key}`), {
    subscribers: site.owners,
  });
  exists = true;
};
</script>

{#if loaded}
  <button disabled={exists} onclick={addReactions}>Add Reactions</button>
{/if}