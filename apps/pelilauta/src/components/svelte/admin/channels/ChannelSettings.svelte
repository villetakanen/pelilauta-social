<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authedFetch } from '@firebase/client/apiClient';
import type { Channel } from 'src/schemas/ChannelSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';

interface Props {
  channel: Channel;
  onRefresh?: () => void;
  onChannelUpdated?: (updatedChannel: Channel) => void;
  onChannelDeleted?: (deletedSlug: string) => void;
}
const { channel, onRefresh, onChannelUpdated, onChannelDeleted }: Props =
  $props();

let name = $state(channel.name);
let description = $state(channel.description || '');

const changes = $derived(
  name !== channel.name || description !== (channel.description || ''),
);

const descriptionLength = $derived(description.length);
const isDescriptionLong = $derived(descriptionLength > 160);

let isSaving = $state(false);
let isRefreshing = $state(false);
let isDeleting = $state(false);

async function saveChanges() {
  if (!changes) return;

  try {
    isSaving = true;
    logDebug('ChannelSettings', `Saving changes for channel: ${channel.slug}`);

    const response = await authedFetch('/api/admin/channels', {
      method: 'PUT',
      body: JSON.stringify({
        originalSlug: channel.slug,
        name: name.trim(),
        category: channel.category,
        icon: channel.icon,
        description: description.trim(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error || response.statusText;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    logDebug('ChannelSettings', 'Channel updated:', result.channel);

    if (onChannelUpdated) {
      onChannelUpdated(result.channel);
    }

    // Show success (TODO: report through pushSnack)
    console.log('Success:', t('admin:channels.edit.success'));
  } catch (error) {
    logError('ChannelSettings', 'Error saving channel:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    alert(`${t('admin:channels.edit.failed')}: ${errorMessage}`);
  } finally {
    isSaving = false;
  }
}

async function forceRefresh() {
  try {
    isRefreshing = true;
    logDebug(
      'ChannelSettings',
      `Refreshing statistics for channel: ${channel.slug}`,
    );

    const response = await authedFetch('/api/admin/channels/refresh', {
      method: 'POST',
      body: JSON.stringify({ channelSlug: channel.slug }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to refresh channel: ${response.status} ${errorText}`,
      );
    }

    const result = await response.json();
    logDebug('ChannelSettings', 'Refresh completed:', result.message);

    if (onRefresh) onRefresh();
    console.log('Success:', result.message);
  } catch (err) {
    logError(
      'ChannelSettings',
      `Failed to refresh channel ${channel.slug}:`,
      err,
    );
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to refresh channel';
    console.error('Error:', errorMessage);
  } finally {
    isRefreshing = false;
  }
}

async function handleDelete() {
  // Enhanced confirmation dialog
  const confirmation = confirm(
    `⚠️ ${t('admin:channels.delete.confirm')}: "${channel.name}"\n\n` +
      `${t('admin:channels.delete.warning')}\n` +
      `- ${t('admin:channels.delete.details.threads')}: ${channel.threadCount}\n` +
      `- ${t('admin:channels.delete.details.category')}: ${channel.category}\n\n` +
      `❗ ${t('admin:channels.delete.cannotUndo')}\n\n` +
      `${t('admin:channels.delete.typeToConfirm')}`,
  );

  if (!confirmation) {
    return;
  }

  // Ask user to type the channel name for confirmation
  const typedName = prompt(
    t('admin:channels.delete.namePrompt', { name: channel.name }),
  );
  if (typedName !== channel.name) {
    alert(t('admin:channels.delete.nameMismatch'));
    return;
  }

  isDeleting = true;
  try {
    const response = await authedFetch(
      `/api/admin/channels?slug=${encodeURIComponent(channel.slug)}`,
      {
        method: 'DELETE',
      },
    );

    if (response.ok) {
      logDebug('ChannelSettings', 'Channel deleted:', channel.slug);
      // Show success feedback (TODO: report through pushSnack)
      console.log(
        'Success:',
        t('admin:channels.delete.success', { name: channel.name }),
      );

      if (onChannelDeleted) {
        onChannelDeleted(channel.slug);
      }
    } else {
      const data = await response.json();
      const errorMessage = data.error || response.statusText;
      // Show error feedback (TODO: report through pushSnack)
      console.error('Error:', errorMessage);
      alert(`${t('admin:channels.delete.failed')}: ${errorMessage}`);
      logError('ChannelSettings', 'Failed to delete channel:', errorMessage);
    }
  } catch (error) {
    logError('ChannelSettings', 'Error deleting channel:', error);
    alert(t('admin:channels.delete.failed'));
  } finally {
    isDeleting = false;
  }
}
</script>

<article class="surface channel-settings-card">
  <div class="channel-main-layout">
    <div class="channel-icon-col">
      <CnIcon noun={channel.icon} />
    </div>

    <div class="channel-fields-col">
      <label>
        {t('admin:channels.edit.name')}
        <input type="text" bind:value={name} />
      </label>
      
      <p class="text-caption">/channels/{channel.slug}</p>

      <label>
        {t('threads:channel.description')}
        <textarea
          rows="3"
          bind:value={description}
        ></textarea>
      </label>
      <div class="text-small {isDescriptionLong ? 'text-warning' : 'text-low'}">
        {descriptionLength}/160 {t('admin:channels.edit.characters')}
        {#if isDescriptionLong}
          <span class="text-warning">({t('admin:channels.edit.tooLong')})</span>
        {/if}
      </div>

      <div class="save-action-row">
        <button 
          type="button"
          onclick={saveChanges}
          disabled={!changes || isSaving}
        >
          {#if isSaving}
            <CnLoader inline />
          {/if}
          <span>{t('actions:save')}</span>
        </button>
      </div>
    </div>

    <div class="channel-stats-col text-small">
      <div>
        <span class="text-high">{channel.threadCount}</span> 
        <span class="text-low">threads</span>
      </div>
      <div class="text-caption text-low">
        {toDisplayString(channel.flowTime)} latest
      </div>
    </div>
  </div>

  <div class="channel-footer-actions">
    <button 
      type="button"
      class="text"
      onclick={forceRefresh}
      disabled={isRefreshing}
      title="Refresh channel statistics"
    >
      {#if isRefreshing}
        <CnLoader inline />
      {:else}
        <CnIcon noun="tools" />
      {/if}
      <span>{t('admin:channels.actions.refresh')}</span>
    </button>
    
    <button 
      type="button" 
      class="text"
      onclick={handleDelete}
      disabled={isDeleting}
      title={t('admin:channels.actions.delete')}
    >
      {#if isDeleting}
        <CnLoader inline />
      {:else}
        <CnIcon noun="delete" />
      {/if}
      <span>{t('admin:channels.actions.delete')}</span>
    </button>
  </div>
</article>

<style>
  .channel-settings-card {
    display: grid;
    row-gap: var(--cn-line);
  }

  .channel-main-layout {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--cn-gap);
    align-items: start;
  }

  .channel-icon-col {
    padding-block-start: calc(var(--cn-grid) * 0.5);
  }

  .channel-fields-col {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .channel-stats-col {
    text-align: right;
    white-space: nowrap;
  }

  .save-action-row {
    display: flex;
    justify-content: flex-end;
  }

  .channel-footer-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--cn-gap);
    border-block-start: 1px solid var(--cn-color-border);
    padding-block-start: var(--cn-grid);
  }

  @media (max-width: 640px) {
    .channel-main-layout {
      grid-template-columns: 1fr;
    }

    .channel-stats-col {
      text-align: left;
    }
  }
</style>
