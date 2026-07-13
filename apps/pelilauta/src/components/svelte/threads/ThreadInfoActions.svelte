<script lang="ts">
import { syndicateToBsky } from 'src/components/svelte/thread-editor/submitThreadUpdate';
import type { Thread } from 'src/schemas/ThreadSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { showAdminTools, uid } from '../../../stores/session';
import ThreadAdminActions from './ThreadAdminActions.svelte';

interface Props {
  thread?: Thread; // Keep optional to handle potential undefined cases gracefully
}
const { thread }: Props = $props();

// Derived state to check if the current user owns the thread
// Access $uid directly as per nanostores/svelte integration
const owns = $derived.by(() => {
  // Ensure thread and owners exist before checking
  return thread?.owners?.includes($uid) ?? false;
});

async function onsubmit(e: Event) {
  e.preventDefault();
  if (!thread || !thread.owners || thread.owners.length === 0)
    throw new Error('Thread or owners not defined');
  try {
    // Check if the thread has owners and use the first one
    await syndicateToBsky(thread, thread.owners[0]);
    pushSnack('actions:reposted');
  } catch (error) {
    console.error('Error syndicating to Bluesky:', error);
    pushSnack('threads:actions.repostFailed');
  }
}
</script>
{#if owns || $showAdminTools}
  <section class="flex flex-col border-t p-2 mt-2">
    {#if owns}
      <h4 class="downscaled m-0">{t('threads:info.actions.title')}</h4> 
      <a
        href={`/threads/${thread?.key}/edit`}
        class="button text-center text"
      >
        {t('actions:edit')} 
      </a>
      <a
        href={`/threads/${thread?.key}/confirmDelete`}
        class="button text-center text"
      >
        {t('actions:delete')} 
      </a>
    {/if}
    <ThreadAdminActions {thread}/>
  </section>
{/if}
  
