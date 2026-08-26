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
  <div class="thread-info-actions">
    {#if owns}
      <section class="surface owner-actions">
        <h2>{t('threads:info.actions.title')}</h2>
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
      </section>
    {/if}
    <ThreadAdminActions {thread}/>
  </div>
{/if}

<style>
  /*
   * The owner's actions and the admin disclosure are separate surface boxes,
   * not one nested in the other, so this wrapper states only the interval
   * between them.
   */
  .thread-info-actions {
    display: grid;
    row-gap: var(--cn-line);
  }

  /*
   * No container reaches into this box, so it states the interval between
   * its own blocks: the heading and the two actions.
   */
  .owner-actions {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>

