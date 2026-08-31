<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authedFetch, authedPost } from '@firebase/client/apiClient';
import { addTopicFormOpen } from '@stores/admin/ChannelsAdminStore';
import { pushSnack } from '@utils/client/snackUtils';
import { logError } from '@utils/logHelpers';
import { t } from 'src/utils/i18n';

let topicName = $state('');
let isSubmitting = $state(false);

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();

  const newTopicName = topicName.trim();

  if (!newTopicName || isSubmitting) return;

  isSubmitting = true;
  try {
    const response = await authedFetch('/api/admin/topics', {
      method: 'POST',
      body: JSON.stringify({ name: newTopicName }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      pushSnack('app:errors.generic');
      logError(
        'AddTopicForm',
        `Failed to create topic: ${response.status} ${errorText}`,
      );
    }
  } catch (err) {
    // Error handling is done by parent component
  } finally {
    isSubmitting = false;
    topicName = '';
    $addTopicFormOpen = false; // Close the form
  }
}

function handleCancel() {
  topicName = '';
  isSubmitting = false;
  $addTopicFormOpen = false;
}
</script>

<div class="surface add-topic-surface">
  <form onsubmit={handleSubmit} class="add-topic-form">
    <label>
      {t('admin:topics.create.name')}
      <input
        type="text"
        bind:value={topicName}
        placeholder={t('admin:topics.create.placeholder')}
        maxlength="50"
        required
        disabled={isSubmitting}
      />
    </label>
    <div class="actions justify-end">
      <button 
        type="button" 
        class="text"
        onclick={handleCancel} 
        disabled={isSubmitting}
      >
        <span>{t('actions:cancel')}</span>
      </button>
      <button 
        type="submit" 
        disabled={!topicName.trim() || isSubmitting}
      >
        {#if isSubmitting}
          <CnLoader inline />
        {:else}
          <CnIcon noun="tag" />
        {/if}
        <span>{t('admin:topics.create.save')}</span>
      </button>
    </div>
  </form>
</div>

<style>
  .add-topic-form {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>