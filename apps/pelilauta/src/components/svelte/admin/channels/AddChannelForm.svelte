<script lang="ts">
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
  <div class="p-4 border border-success radius-s bg-success-low mb-4">
    <p class="text-success">
      <cn-icon noun="check" small></cn-icon>
      {t('admin:channels.add.success', { name: channelName })}
    </p>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="space-y-4">
    {#if error}
      <div class="p-4 border border-error radius-s bg-error-low">
        <p class="text-error">
          <cn-icon noun="info" small></cn-icon>
          {error}
        </p>
      </div>
    {/if}

    <fieldset class="space-y-4">
      <label class="block">
        <span class="text-sm font-semibold">{t('admin:channels.add.form.name')} *</span>
        <input
          type="text"
          bind:value={channelName}
          placeholder={t('admin:channels.add.form.namePlaceholder')}
          class="w-full mt-1 px-3 py-2 border rounded-md"
          required 
          disabled={isSaving}
        />
       
          
      </label>
      <p class="text-caption mt-1">
            {t('admin:channels.add.form.urlSlugPrefix')} <code>{`[${window.location.origin}/channels/${channelSlug || '[slug]'}]`}</code>
      </p>
            
      <label class="block">
        <span class="text-sm font-semibold">{t('admin:channels.add.form.category')} *</span>
        <select
          bind:value={selectedCategory}
          class="w-full mt-1 px-3 py-2 border rounded-md"
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
          <p class="text-caption text-warning mt-1">
            {t('admin:channels.add.form.categoryEmptyHelper')}
          </p>
        {/if}
      </label>

      <label class="block">
        <span class="text-sm font-semibold">{t('admin:channels.add.form.icon')} *</span>
        <div class="mt-1">
          <NounSelect 
            bind:value={icon}
            defaultValue="discussion"
            placeholder={t('admin:channels.add.form.iconPlaceholder')}
            searchable
            required
            disabled={isSaving}
          />
        </div>
        <p class="text-caption mt-1">
          {t('admin:channels.add.form.iconHelper')}
        </p>
      </label>
    </fieldset>

    <!-- Action buttons -->
    <div class="toolbar pt-4">
      <button 
        type="button" 
        class="btn" 
        onclick={handleCancel} 
        disabled={isSaving}
      >
        {t('admin:channels.add.form.actions.cancel')}
      </button>
      
      <button 
        type="button"
        class="btn text"
        onclick={resetForm}
        disabled={isSaving}
      >
        <cn-icon noun="spiral" small></cn-icon>
        {t('admin:channels.add.form.actions.reset')}
      </button>
      
      <button 
        type="submit" 
        class="btn btn-primary" 
        disabled={isSaving || !channelName || !selectedCategory}
      >
        {#if isSaving}
          <cn-loader small></cn-loader>
        {:else}
          <cn-icon noun="add" small></cn-icon>
        {/if}
        <span>{t('admin:channels.add.form.actions.create')}</span>
      </button>
    </div>
  </form>
{/if}