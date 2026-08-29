<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { onMount } from 'svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();
let exists = $state(false);
let loaded = $state(false);
let isSubmitting = $state(false);

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
  isSubmitting = true;
  try {
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(getFirestore(), `reactions/${site.key}`), {
      subscribers: site.owners,
    });
    exists = true;
  } finally {
    isSubmitting = false;
  }
};
</script>

{#if loaded}
  <button 
    type="button" 
    class="text" 
    disabled={exists || isSubmitting} 
    onclick={addReactions}
  >
    {#if isSubmitting}
      <CnLoader inline />
    {:else}
      <CnIcon noun="reaction" />
    {/if}
    <span>{exists ? 'Reactions active' : 'Enable reactions'}</span>
  </button>
{/if}