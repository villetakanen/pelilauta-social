<script lang="ts">
import type { Thread } from '@schemas/ThreadSchema';
import { meta, metaLoading } from '@stores/admin/ChannelsAdminStore';
import { showAdminTools } from '@stores/session';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import LabelManager from './LabelManager.svelte';

interface Props {
  thread?: Thread; // Keep optional to handle potential undefined cases gracefully
}
const { thread }: Props = $props();

let updating = $state(false);

// This effect ensures the store is subscribed to and triggers onMount
$effect(() => {
  // Just accessing $meta here creates a subscription that triggers the store's onMount
  void $meta;
});

async function handleChannelChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  const newChannel = select.value;

  if (!thread?.key || !newChannel || newChannel === thread.channel) {
    return;
  }

  updating = true;

  try {
    const { updateThreadApi } = await import(
      '@firebase/client/threads/updateThreadApi'
    );

    // Silent update - don't update timestamps
    await updateThreadApi(
      {
        key: thread.key,
        channel: newChannel,
      },
      true,
    );

    logDebug('ThreadAdminActions', 'Thread channel updated silently', {
      threadKey: thread.key,
      oldChannel: thread.channel,
      newChannel,
    });

    // Update the local thread object
    if (thread) {
      thread.channel = newChannel;
    }
  } catch (error) {
    logError('ThreadAdminActions', 'Failed to update thread channel:', error);
    // Revert the select value on error
    select.value = thread.channel || '';
  } finally {
    updating = false;
  }
}
</script>

{#if $showAdminTools && thread}
  <cn-accordion class="border radius-m" title="ADMIN" noun="admin">
    <a
      href={`/threads/${thread?.key}/confirmDelete`}
      class="button text-center text"
    >
      {t("actions:delete")}
    </a>

    <label>
      Move to channel:
      {#if $metaLoading}
        <select disabled>
          <option>Loading channels...</option>
        </select>
      {:else if $meta?.topics && $meta.topics.length > 0}
        <select
          name="channel"
          onchange={handleChannelChange}
          disabled={updating}
          value={thread.channel}
        >
          {#each $meta.topics as channel}
            <option value={channel.slug}>
              {channel.name}
            </option>
          {/each}
        </select>
      {:else}
        <select disabled>
          <option>No channels available</option>
        </select>
      {/if}
    </label>

    <div class="mt-3 pt-3 border-t">
      <LabelManager {thread} />
    </div>
  </cn-accordion>
{/if}
