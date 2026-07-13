<script lang="ts">
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

<div class="toolbar border-b">
  <h2 class="m-0 grow">{topic}</h2>
  <button 
    onclick={moveTopicUp}
    class="icon"
    disabled={!canMoveUp || isMoving}
    aria-label={t('admin:topics.moveUp')}
    >
    {#if isMoving}
      <cn-loader small></cn-loader>
    {:else}
      <cn-icon noun="arrow-up"></cn-icon>
    {/if}
  </button>
  <button 
    onclick={moveTopicDown}
    class="icon"
    disabled={!canMoveDown || isMoving}
    aria-label={t('admin:topics.moveDown')}
    >
    {#if isMoving}
      <cn-loader small></cn-loader>
    {:else}
      <cn-icon noun="arrow-down"></cn-icon>
    {/if}
  </button>
    <button 
      onclick={deleteTopic}
      class="text"
      disabled={hasChannels || isDeleting}
      aria-label={hasChannels ? t('admin:topics.deleteDisabled') : t('admin:topics.delete')}
      title={hasChannels ? t('admin:topics.deleteDisabled') : t('admin:topics.delete')}
    >
      {#if isDeleting}
        <cn-loader small></cn-loader>
      {:else}
        <cn-icon noun="delete"></cn-icon>
      {/if}
    </button>

</div>
