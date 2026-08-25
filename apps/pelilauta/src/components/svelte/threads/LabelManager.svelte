<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
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

<div class="labels">
  <h3 class="text-caption text-high">{t("admin:labels.title")}</h3>
  <p class="text-small text-low">{t("admin:labels.legend")}</p>

  {#if thread.labels && thread.labels.length > 0}
    <div class="chip-list">
      {#each thread.labels as label (label)}
        <div class="chip">
          <span>{label}</span>
          <button
            type="button"
            onclick={() => removeLabel(label)}
            disabled={isRemoving === label}
            aria-label={t("admin:labels.removeLabel")}
          >
            {#if isRemoving === label}
              <CnIcon noun="loader" size="small" />
            {:else}
              <CnIcon noun="close" size="small" />
            {/if}
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-small text-low">{t("admin:labels.noLabels")}</p>
  {/if}

  <div class="add-row">
    <input
      type="text"
      bind:value={newLabel}
      onkeydown={handleKeydown}
      placeholder={t("admin:labels.addPlaceholder")}
      disabled={isAdding}
    />
    <button
      type="button"
      onclick={addLabel}
      disabled={isAdding || !newLabel.trim()}
      class="button"
    >
      {#if isAdding}
        <CnIcon noun="loader" size="small" />
      {:else}
        {t("admin:labels.addLabel")}
      {/if}
    </button>
  </div>

  {#if errorMessage}
    <p class="text-small surface error">{errorMessage}</p>
  {/if}
</div>

<style>
  /*
   * This block has no container reaching into it, so its own interior
   * rhythm — between the heading, the legend, the chip list and the add
   * row — is stated here. It is an interval inside one block, not between
   * blocks, so it takes --cn-grid rather than --cn-line.
   */
  .labels {
    display: grid;
    row-gap: var(--cn-grid);
  }

  /* The input and the add button sit in one row. */
  .add-row {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  /*
   * A flex item's automatic minimum is its content size, and an input carries a
   * default width of twenty characters in the technical register — wider than the
   * small column this block sits in. Without the override the row cannot shrink to
   * the column and the button lands outside it.
   */
  .add-row input {
    flex: 1 1 auto;
    min-inline-size: 0;
  }
</style>
