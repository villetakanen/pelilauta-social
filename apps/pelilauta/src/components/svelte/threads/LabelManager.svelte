<script lang="ts">
import type { Thread } from '@schemas/ThreadSchema';
import { t } from '@utils/i18n';
import { logDebug, logError } from '@utils/logHelpers';
import { normalizeTag } from '@utils/shared/threadTagHelpers';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();

let newLabel = $state('');
let isAdding = $state(false);
let isRemoving = $state<string | null>(null);
let errorMessage = $state('');

async function addLabel() {
  const trimmedLabel = newLabel.trim();

  if (!trimmedLabel) {
    errorMessage = t('admin:labels.errors.emptyLabel');
    return;
  }

  const normalized = normalizeTag(trimmedLabel);

  // Check if label already exists
  if (thread.labels?.some((l) => normalizeTag(l) === normalized)) {
    errorMessage = t('admin:labels.errors.alreadyExists', {
      label: trimmedLabel,
    });
    return;
  }

  isAdding = true;
  errorMessage = '';

  try {
    const { authedPost } = await import('@firebase/client/apiClient');

    const response = await authedPost(`/api/threads/${thread.key}/labels`, {
      labels: [trimmedLabel],
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add label');
    }

    const result = await response.json();

    logDebug('LabelManager', 'Label added successfully', {
      threadKey: thread.key,
      label: trimmedLabel,
    });

    // Update local thread object
    thread.labels = result.labels || [];

    // Clear input
    newLabel = '';

    // Show success feedback
    errorMessage = '';
  } catch (error) {
    logError('LabelManager', 'Failed to add label:', error);
    errorMessage = t('admin:labels.errors.addFailed');
  } finally {
    isAdding = false;
  }
}

async function removeLabel(label: string) {
  isRemoving = label;
  errorMessage = '';

  try {
    const { authedDelete } = await import('@firebase/client/apiClient');

    const response = await authedDelete(`/api/threads/${thread.key}/labels`, {
      labels: [label],
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove label');
    }

    const result = await response.json();

    logDebug('LabelManager', 'Label removed successfully', {
      threadKey: thread.key,
      label,
    });

    // Update local thread object
    thread.labels = result.labels || [];
  } catch (error) {
    logError('LabelManager', 'Failed to remove label:', error);
    errorMessage = t('admin:labels.errors.removeFailed');
  } finally {
    isRemoving = null;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addLabel();
  }
}
</script>

<div class="flex flex-col">
  <h3 class="text-caption text-high mb-1">{t("admin:labels.title")}</h3>
  <p class="text-small text-low mb-2">{t("admin:labels.legend")}</p>

  {#if thread.labels && thread.labels.length > 0}
    <div class="flex flex-wrap items-center mb-2">
      {#each thread.labels as label (label)}
        <div class="flex items-center cn-chip border mr-1 mb-1">
          <span>{label}</span>
          <button
            type="button"
            class="ml-1"
            onclick={() => removeLabel(label)}
            disabled={isRemoving === label}
            aria-label={t("admin:labels.removeLabel")}
          >
            {#if isRemoving === label}
              <cn-icon noun="loader" small></cn-icon>
            {:else}
              <cn-icon noun="close" small></cn-icon>
            {/if}
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-small text-low mb-2">{t("admin:labels.noLabels")}</p>
  {/if}

  <div class="flex items-center">
    <input
      type="text"
      bind:value={newLabel}
      onkeydown={handleKeydown}
      placeholder={t("admin:labels.addPlaceholder")}
      disabled={isAdding}
      class="grow"
    />
    <button
      type="button"
      onclick={addLabel}
      disabled={isAdding || !newLabel.trim()}
      class="button ml-1"
    >
      {#if isAdding}
        <cn-icon noun="loader" small></cn-icon>
      {:else}
        {t("admin:labels.addLabel")}
      {/if}
    </button>
  </div>

  {#if errorMessage}
    <p class="text-small text-error mt-1">{errorMessage}</p>
  {/if}
</div>
