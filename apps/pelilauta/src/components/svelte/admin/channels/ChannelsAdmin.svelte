<script lang="ts">
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

<section class="content-listing">
  <header class="surface elevation-1">
    <div class="toolbar px-0">
      <div class="grow">
        <h1>{t('admin:title')}</h1>
      </div>
      <div class="flex gap-2">
        <button onclick={refreshAllChannels} class="text" disabled={isLoading}>
          {#if isLoading}
            <cn-loader small></cn-loader>
          {:else}
            <cn-icon noun="spiral" small></cn-icon>
          {/if}
          <span>{t('admin:channels.refreshAll')}</span>
        </button>

        <a href="/admin/channels/add" class="button">
          <cn-icon noun="add" small></cn-icon>
          <span>{t('admin:channels.addChannel')}</span>
        </a>
      </div>
    </div>
    <p class="text-caption pb-1">
      {t('admin:description')}
    </p>
  </header>

  <div class="listing-items">

    {#if error}
      <div class="p-4 border border-error radius-s bg-error-low">
        <p class="text-error">
          <cn-icon noun="info" small></cn-icon>
          {error}
        </p>
                <button onclick={() => error = null} class="btn btn-sm mt-2">
          <cn-icon noun="tools" small></cn-icon>
          {t('admin:errors.retry')}
        </button>
      </div>
    {:else if isLoading}
      <div class="p-4 text-center">
        <cn-loader></cn-loader>
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
    <div class="toolbar items-center">
      <button onclick={() => addTopicFormOpen.set(true)} data-add-topic-trigger>
        <cn-icon noun="add" small></cn-icon>
        <span>{t('admin:topics.addTopic')}</span>
      </button>
      </div>
    {/if}
  </div>
</section>

<pre class="debug">{JSON.stringify($meta, null, 2)}</pre>