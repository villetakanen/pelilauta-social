<script lang="ts">
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

<div class="surface elevation-1 p-4 mb-2">
  <form onsubmit={handleSubmit}>
    <div class="flex gap-2 items-end">
            <div class="grow">
        <label for="topic-name-input" class="block text-caption mb-1">{t('admin:topics.create.name')}:</label>
        <input
          id="topic-name-input"
          type="text"
          bind:value={topicName}
          placeholder={t('admin:topics.create.placeholder')}
          class="w-full"
          maxlength="50"
          required
          disabled={isSubmitting}
        />
      </div>
      <div class="flex gap-1">
        <button 
          type="submit" 
          class="btn btn-primary btn-sm" 
          disabled={!topicName.trim() || isSubmitting}
        >
          {#if isSubmitting}
            <cn-loader small></cn-loader>
          {:else}
            <cn-icon noun="tag" small></cn-icon>
          {/if}
          <span>{t('admin:topics.create.save')}</span>
        </button>
        <button 
          type="button" 
          onclick={handleCancel} 
          class="btn btn-sm"
          disabled={isSubmitting}
        >
          {t('actions:cancel')}
        </button>
      </div>
    </div>
  </form>
</div>