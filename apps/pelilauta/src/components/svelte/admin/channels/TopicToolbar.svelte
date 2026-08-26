<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authedFetch } from '@firebase/client/apiClient';
import { forumTopics } from '@stores/admin/ChannelsAdminStore';
import { t } from '../../../../utils/i18n';
import { logDebug, logError } from '../../../../utils/logHelpers';

interface Props {
  topic: string;
  hasChannels: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTopicDeleted?: () => void;
  onTopicsReordered?: () => void;
}

const {
  topic,
  hasChannels,
  canMoveUp,
  canMoveDown,
  onTopicDeleted,
  onTopicsReordered,
}: Props = $props();

let isDeleting = $state(false);
let isMoving = $state(false);

async function deleteTopic() {
  if (hasChannels || isDeleting) return;

  try {
    isDeleting = true;
    logDebug('TopicToolbar', 'Deleting topic:', topic);

    const response = await authedFetch(
      `/api/admin/topics?name=${encodeURIComponent(topic)}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete topic: ${response.status} ${errorText}`,
      );
    }

    logDebug('TopicToolbar', 'Topic deleted successfully:', topic);

    // Notify parent component so it can refresh the topic list
    onTopicDeleted?.();

    // Show success feedback (this should be replaced with proper snackbar later)
    console.log('Success:', t('admin:topics.delete.success', { name: topic }));
  } catch (err) {
    logError('TopicToolbar', 'Failed to delete topic:', err);
    const errorMessage =
      err instanceof Error ? err.message : t('admin:topics.delete.failed');

    // Show error feedback (this should be replaced with proper snackbar later)
    console.error('Error:', errorMessage);
  } finally {
    isDeleting = false;
  }
}

async function moveTopicUp() {
  if (!canMoveUp || isMoving) return;

  const currentIndex = $forumTopics.indexOf(topic);
  if (currentIndex <= 0) return;

  try {
    isMoving = true;
    logDebug('TopicToolbar', 'Moving topic up:', topic);

    // Create new array with topic moved up
    const reorderedTopics = [...$forumTopics];
    [reorderedTopics[currentIndex - 1], reorderedTopics[currentIndex]] = [
      reorderedTopics[currentIndex],
      reorderedTopics[currentIndex - 1],
    ];

    const response = await authedFetch('/api/admin/topics', {
      method: 'PUT',
      body: JSON.stringify({ topics: reorderedTopics }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to reorder topics: ${response.status} ${errorText}`,
      );
    }

    logDebug('TopicToolbar', 'Topic moved up successfully:', topic);

    // Notify parent component to refresh the topic list
    onTopicsReordered?.();

    // Show success feedback (this should be replaced with proper snackbar later)
    console.log('Success:', t('admin:topics.moveUp.success', { name: topic }));
  } catch (err) {
    logError('TopicToolbar', 'Failed to move topic up:', err);
    const errorMessage =
      err instanceof Error ? err.message : t('admin:topics.moveUp.failed');

    // Show error feedback (this should be replaced with proper snackbar later)
    console.error('Error:', errorMessage);
  } finally {
    isMoving = false;
  }
}

async function moveTopicDown() {
  if (!canMoveDown || isMoving) return;

  const currentIndex = $forumTopics.indexOf(topic);
  if (currentIndex >= $forumTopics.length - 1) return;

  try {
    isMoving = true;
    logDebug('TopicToolbar', 'Moving topic down:', topic);

    // Create new array with topic moved down
    const reorderedTopics = [...$forumTopics];
    [reorderedTopics[currentIndex], reorderedTopics[currentIndex + 1]] = [
      reorderedTopics[currentIndex + 1],
      reorderedTopics[currentIndex],
    ];

    const response = await authedFetch('/api/admin/topics', {
      method: 'PUT',
      body: JSON.stringify({ topics: reorderedTopics }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to reorder topics: ${response.status} ${errorText}`,
      );
    }

    logDebug('TopicToolbar', 'Topic moved down successfully:', topic);

    // Notify parent component to refresh the topic list
    onTopicsReordered?.();

    // Show success feedback (this should be replaced with proper snackbar later)
    console.log(
      'Success:',
      t('admin:topics.moveDown.success', { name: topic }),
    );
  } catch (err) {
    logError('TopicToolbar', 'Failed to move topic down:', err);
    const errorMessage =
      err instanceof Error ? err.message : t('admin:topics.moveDown.failed');

    // Show error feedback (this should be replaced with proper snackbar later)
    console.error('Error:', errorMessage);
  } finally {
    isMoving = false;
  }
}
</script>

<div class="topic-toolbar">
  <h2>{topic}</h2>
  <div class="topic-actions">
    <button 
      type="button"
      onclick={moveTopicUp}
      class="text"
      disabled={!canMoveUp || isMoving}
      aria-label={t('admin:topics.moveUp')}
      title={t('admin:topics.moveUp')}
    >
      {#if isMoving}
        <CnLoader inline />
      {:else}
        <CnIcon noun="arrow-up" />
      {/if}
    </button>
    <button 
      type="button"
      onclick={moveTopicDown}
      class="text"
      disabled={!canMoveDown || isMoving}
      aria-label={t('admin:topics.moveDown')}
      title={t('admin:topics.moveDown')}
    >
      {#if isMoving}
        <CnLoader inline />
      {:else}
        <CnIcon noun="arrow-down" />
      {/if}
    </button>
    <button 
      type="button"
      onclick={deleteTopic}
      class="text"
      disabled={hasChannels || isDeleting}
      aria-label={hasChannels ? t('admin:topics.deleteDisabled') : t('admin:topics.delete')}
      title={hasChannels ? t('admin:topics.deleteDisabled') : t('admin:topics.delete')}
    >
      {#if isDeleting}
        <CnLoader inline />
      {:else}
        <CnIcon noun="delete" />
      {/if}
    </button>
  </div>
</div>

<style>
  .topic-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--cn-gap);
    border-block-end: 1px solid var(--cn-color-border);
    padding-block: var(--cn-grid);
  }

  .topic-toolbar h2 {
    margin: 0;
  }

  .topic-actions {
    display: flex;
    align-items: center;
    gap: calc(var(--cn-grid) * 0.5);
  }
</style>
