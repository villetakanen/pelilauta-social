<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
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
  <details class="surface">
    <!--
      The heading stands inside the control, because the disclosure is both the
      box's own section heading and the thing a reader presses to open it.
    -->
    <summary>
      <CnIcon noun="admin" size="small" decorative />
      <h2>{t("admin:thread.tools")}</h2>
    </summary>
    <a
      href={`/threads/${thread?.key}/confirmDelete`}
      class="button text-center text"
    >
      {t("actions:delete")}
    </a>

    <label>
      {t("admin:thread.moveToChannel")}
      {#if $metaLoading}
        <select disabled>
          <option>{t("admin:thread.channelsLoading")}</option>
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
          <option>{t("admin:thread.noChannels")}</option>
        </select>
      {/if}
    </label>

    <hr />
    <div>
      <LabelManager {thread} />
    </div>
  </details>
{/if}

<style>
  /*
   * No container reaches into this box, so it states the interval between
   * its own blocks: the summary, the delete action, the channel select and
   * the label manager.
   */
  details {
    display: grid;
    row-gap: var(--cn-line);
  }

  /*
   * @todo `preflight.css` gives `summary` only `display: list-item`; nothing
   * else in the design system names `details` or `summary`, so this
   * disclosure draws its own open/closed affordance. It belongs in the
   * design system as a Disclosure capability, not bespoke here.
   */
  summary {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  /* The affordance stands at the row's end, where the reader's eye leaves it. */
  summary::before {
    order: 1;
    margin-inline-start: auto;
    content: "▾";
    transition: rotate var(--cn-duration-ui) var(--cn-easing-ui);
  }

  details[open] > summary::before {
    rotate: 180deg;
  }
</style>
