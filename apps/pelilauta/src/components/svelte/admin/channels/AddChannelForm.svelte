<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { authedFetch } from '@firebase/client/apiClient';
import { forumTopics } from '@stores/admin/ChannelsAdminStore';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import { toMekanismiURI } from 'src/utils/mekanismiUtils';
import NounSelect from '../../ui/NounSelect.svelte';

let channelName = $state('');
const channelSlug = $derived.by(() => toMekanismiURI(channelName));

let selectedCategory = $state('');
let icon = $state('discussion'); // Default to a real icon

let isSaving = $state(false);
let error = $state<string | null>(null);
let success = $state(false);

// Set default category when topics load
$effect(() => {
  if ($forumTopics.length > 0 && !selectedCategory) {
    selectedCategory = $forumTopics[0];
  }
});

async function addChannel(name: string, category: string, icon: string) {
  try {
    logDebug('AddChannelForm', 'Creating channel:', { name, category, icon });

    const response = await authedFetch('/api/admin/channels', {
      method: 'POST',
      body: JSON.stringify({ name, category, icon }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create channel: ${response.status} ${errorText}`,
      );
    }

    const newChannel = await response.json();
    logDebug('AddChannelForm', 'Channel created successfully:', newChannel);

    return newChannel;
  } catch (err) {
    logError('AddChannelForm', 'Failed to create channel:', err);
    throw err;
  }
}

function resetForm() {
  channelName = '';
  selectedCategory = $forumTopics.length > 0 ? $forumTopics[0] : '';
  icon = 'discussion';
  error = null;
  success = false;
}

async function handleSave() {
  if (!channelName || !selectedCategory) {
    error = t('admin:channels.add.form.nameRequired');
    return;
  }

  isSaving = true;
  error = null;

  try {
    await addChannel(channelName, selectedCategory, icon);
    success = true;

    // Show success message and redirect after a short delay
    setTimeout(() => {
      window.location.href = '/admin/channels';
    }, 1500);
  } catch (err) {
    error =
      err instanceof Error ? err.message : t('admin:channels.create.failed');
  } finally {
    isSaving = false;
  }
}

function handleCancel() {
  window.history.back();
}

function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  handleSave();
}
</script>

{#if success}
  <div class="surface info">
    <p>
      <CnIcon noun="check" size="small" />
      {t('admin:channels.add.success', { name: channelName })}
    </p>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="surface add-channel-form">
    {#if error}
      <div class="surface error">
        <p>
          <CnIcon noun="info" size="small" />
          {error}
        </p>
      </div>
    {/if}

    <fieldset class="fields">
      <label>
        {t('admin:channels.add.form.name')} *
        <input
          type="text"
          bind:value={channelName}
          placeholder={t('admin:channels.add.form.namePlaceholder')}
          required 
          disabled={isSaving}
        />
      </label>
      <p class="text-caption">
        {t('admin:channels.add.form.urlSlugPrefix')} <code>{typeof window !== 'undefined' ? `${window.location.origin}/channels/${channelSlug || '[slug]'}` : `/channels/${channelSlug || '[slug]'}`}</code>
      </p>
            
      <label>
        {t('admin:channels.add.form.category')} *
        <select
          bind:value={selectedCategory}
          required
          disabled={$forumTopics.length === 0 || isSaving}
        >
          {#if $forumTopics.length === 0}
            <option value="" disabled>{t('admin:channels.add.form.categoryEmpty')}</option>
          {:else}
            <option value="" disabled selected={!selectedCategory}>{t('admin:channels.add.form.categoryPlaceholder')}</option>
            {#each $forumTopics as topic}
              <option value={topic}>{topic}</option>
            {/each}
          {/if}
        </select>
        {#if $forumTopics.length === 0}
          <p class="text-caption text-warning">
            {t('admin:channels.add.form.categoryEmptyHelper')}
          </p>
        {/if}
      </label>

      <div class="icon-field-row">
        <span class="field-title">{t('admin:channels.add.form.icon')} *</span>
        <NounSelect 
          bind:value={icon}
          defaultValue="discussion"
          placeholder={t('admin:channels.add.form.iconPlaceholder')}
          searchable
          required
          disabled={isSaving}
        />
        <p class="text-caption">
          {t('admin:channels.add.form.iconHelper')}
        </p>
      </div>
    </fieldset>

    <!-- Action buttons -->
    <div class="actions">
      <button 
        type="button" 
        class="text"
        onclick={resetForm}
        disabled={isSaving}
      >
        <CnIcon noun="spiral" />
        <span>{t('admin:channels.add.form.actions.reset')}</span>
      </button>

      <button 
        type="button" 
        class="text"
        onclick={handleCancel} 
        disabled={isSaving}
      >
        <span>{t('admin:channels.add.form.actions.cancel')}</span>
      </button>
      
      <button 
        type="submit" 
        disabled={isSaving || !channelName || !selectedCategory}
      >
        {#if isSaving}
          <CnLoader inline />
        {:else}
          <CnIcon noun="add" />
        {/if}
        <span>{t('admin:channels.add.form.actions.create')}</span>
      </button>
    </div>
  </form>
{/if}

<style>
  .add-channel-form {
    display: grid;
    row-gap: var(--cn-line);
  }

  fieldset.fields {
    border: none;
    margin: 0;
    padding: 0;
    display: grid;
    row-gap: var(--cn-line);
  }

  .icon-field-row {
    display: grid;
    row-gap: calc(var(--cn-grid) * 0.5);
  }

  .field-title {
    color: var(--cn-color-field-label);
    font-size: var(--cn-font-size-small);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--cn-gap);
  }
</style>
