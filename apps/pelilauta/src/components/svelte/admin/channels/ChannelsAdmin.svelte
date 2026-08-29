<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authedFetch } from '@firebase/client/apiClient';
import {
  addTopicFormOpen,
  forumTopics,
  meta,
  metaLoading,
} from '@stores/admin/ChannelsAdminStore';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import AddTopicForm from './AddTopicForm.svelte';
import ChannelSettings from './ChannelSettings.svelte';
import TopicToolbar from './TopicToolbar.svelte';

// Derive data from the subscribed store instead of local state
const channels = $derived.by(() => $meta?.topics ?? []);
const isLoading = $derived($metaLoading);

// If we have no topics, always show the new topic form
// Otherwise, show it based on user interaction
const showNewTopicForm = $derived(
  $addTopicFormOpen || $forumTopics.length === 0,
);

let error = $state<string | null>(null);

// Clear error when data loads successfully
$effect(() => {
  if ($meta && error) {
    error = null;
  }
});

// Keyboard shortcuts for admin actions
$effect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Only handle shortcuts when no input is focused
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Ctrl/Cmd + R: Refresh all channels
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      refreshAllChannels();
    }

    // Ctrl/Cmd + N: Navigate to "Add Channel" page
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      window.location.href = '/admin/channels/add';
    }

    // Ctrl/Cmd + T: Open "Add Topic" form
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      addTopicFormOpen.set(true);
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
});

function filterChannels(topic: string) {
  return channels.filter((channel) => channel.category === topic);
}

async function refreshAllChannels() {
  try {
    logDebug('ChannelsAdmin', 'Refreshing all channel statistics');

    const response = await authedFetch('/api/admin/channels/refresh', {
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to refresh channels: ${response.status} ${errorText}`,
      );
    }

    const result = await response.json();
    logDebug('ChannelsAdmin', 'Refresh completed:', result.message);
  } catch (err) {
    logError('ChannelsAdmin', 'Failed to refresh channels:', err);
  }
}

function cancelAddTopic() {
  addTopicFormOpen.set(false);
}

function handleChannelDeleted(deletedSlug: string) {
  // The store subscription will automatically update with the latest data
  // No need to manually filter the local state
  logDebug('ChannelsAdmin', `Channel deletion handled: ${deletedSlug}`);
}
</script>

<section class="content-prose channels-admin-view">
  <header class="surface">
    <div class="header-row">
      <h1>{t('admin:title')}</h1>
      <div class="header-actions">
        <button onclick={refreshAllChannels} class="text" disabled={isLoading}>
          {#if isLoading}
            <CnLoader inline />
          {:else}
            <CnIcon noun="spiral" />
          {/if}
          <span>{t('admin:channels.refreshAll')}</span>
        </button>

        <a href="/admin/channels/add" class="button">
          <CnIcon noun="add" />
          <span>{t('admin:channels.addChannel')}</span>
        </a>
      </div>
    </div>
    <p class="text-caption">
      {t('admin:description')}
    </p>
  </header>

  <div class="channels-listing">
    {#if error}
      <div class="surface error">
        <p>
          <CnIcon noun="info" size="small" />
          {error}
        </p>
        <button onclick={() => error = null} class="text">
          <CnIcon noun="tools" />
          <span>{t('admin:errors.retry')}</span>
        </button>
      </div>
    {:else if isLoading}
      <div class="surface text-center">
        <CnLoader />
        <p class="text-caption">{t('admin:channels.loading')}</p>
      </div>
    {:else}  
      {#each $forumTopics as topic, index}
        <TopicToolbar 
          {topic}
          hasChannels={filterChannels(topic).length > 0}
          canMoveUp={index > 0}
          canMoveDown={index < $forumTopics.length - 1}
          onTopicDeleted={() => {/* Store will automatically update */}}
          onTopicsReordered={() => {/* Store will automatically update */}}
        />
        {#each filterChannels(topic) as channel}
          <ChannelSettings 
            {channel} 
            onRefresh={() => {/* Store will automatically update */}}
            onChannelDeleted={handleChannelDeleted}
          />
        {/each}
      {/each}
    {/if}
    {#if showNewTopicForm}
      <AddTopicForm />
    {:else}
      <div class="add-topic-row">
        <button onclick={() => addTopicFormOpen.set(true)} data-add-topic-trigger>
          <CnIcon noun="add" />
          <span>{t('admin:topics.addTopic')}</span>
        </button>
      </div>
    {/if}
  </div>
</section>

<style>
  .channels-admin-view {
    display: grid;
    row-gap: var(--cn-line);
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--cn-gap);
    flex-wrap: wrap;
  }

  .header-row h1 {
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .channels-listing {
    display: grid;
    row-gap: var(--cn-line);
  }

  .add-topic-row {
    display: flex;
    justify-content: flex-start;
  }
</style>
