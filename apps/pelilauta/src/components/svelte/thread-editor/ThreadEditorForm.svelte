<script lang="ts">
/**
 * Thread authoring, for both the create and the edit route.
 *
 * The view is a consumer of the editor shell: it slots the thread's frontmatter
 * — title, channel, attachments, the tags the content produced — and the
 * actions, and the shell decides the geometry and whether the document is
 * dirty. The shell also asks before a dirty departure, so this form saves and
 * navigates, and guards nothing itself.
 */

import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLightbox from '@design-system/components/CnLightbox.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import CnEditorShell from '@editor/CnEditorShell.svelte';
import type { Channel } from 'src/schemas/ChannelSchema';
import type { Thread } from 'src/schemas/ThreadSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { extractTags } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';
import AddFilesButton from '../app/AddFilesButton.svelte';
import ChannelSelect from './ChannelSelect.svelte';
import { submitThreadUpdate } from './submitThreadUpdate';

interface Props {
  thread?: Thread;
  /** Absent when creating a thread without a channel preselected by the URL. */
  channelKey?: string;
  channels: Channel[];
}

const { thread, channelKey, channels }: Props = $props();

// Component level state
let saving = $state(false);
let files = $state<File[]>([]);
let existingImages = $state<Array<{ url: string; alt: string }>>([]);
let tags = $state<string[]>(thread?.tags || []);
let markdownContent = $state(thread?.markdownContent || '');

/*
 * The shell tracks dirtiness; this component only reports it: the fields are
 * native controls inside the region it reads, so a title edited back to what it
 * was leaves the send action disabled, which a set-once flag never managed.
 */
let shell: CnEditorShell | undefined = $state();
let dirty = $state(false);

// Derived state
const previews = $derived.by(() => {
  const filePreviews = files.map((file) => ({
    src: URL.createObjectURL(file),
    caption: file.name,
  }));

  const imagePreviews = existingImages.map((image) => ({
    src: image.url,
    caption: image.alt,
  }));

  return [...imagePreviews, ...filePreviews];
});

onMount(() => {
  if (thread?.images) {
    existingImages = thread.images;
  }
});

async function handleSubmit(event: Event) {
  logDebug('ThreadEditorForm', 'handleSubmit', event);
  event.preventDefault();
  if (saving || !dirty) return;
  saving = true;
  const form = new FormData(event.target as HTMLFormElement);
  const data: Partial<Thread> = {
    title: form.get('title') as string,
    channel: form.get('channel') as string,
    markdownContent: markdownContent,
    tags,
    owners: [$uid],
  };
  if (thread) {
    data.key = thread.key;
  }
  try {
    const slug = await submitThreadUpdate(data, files);
    saving = false;
    /*
     * Clean before leaving. The write has landed, so the document the shell is
     * holding is saved — and navigating away from a shell that still reads
     * dirty would raise the browser's guard over a departure the writer
     * asked for.
     */
    shell?.markClean();
    window.location.href = `/threads/${slug}`;
  } catch (error) {
    logError('Error saving thread', error);
    pushSnack(t('threads:editor.error.save'));
    saving = false;
  }
}

async function handleContentChange(content: string) {
  markdownContent = content;
  tags = extractTags(content);
}

function onAddFiles(newFiles: File[]) {
  if (!newFiles || newFiles.length === 0) {
    return;
  }
  files = [...files, ...newFiles];
}

/*
 * Cancel is a departure, so it asks the shell, which answers for whether the
 * writer needs asking first and leaves through the route's one handler.
 */
function cancel() {
  shell?.requestBack();
}
</script>

<form id="thread-editor" onsubmit={handleSubmit}>
  <CnEditorShell
    bind:this={shell}
    bind:value={markdownContent}
    name="markdownContent"
    disabled={saving}
    placeholder={t('entries:thread.placeholders.content')}
    onChange={handleContentChange}
    onDirtyChange={(next) => {
      dirty = next;
    }}
    confirmTitle={t('common:editor.unsaved.title')}
    confirmBody={t('common:editor.unsaved.body')}
    confirmLeave={t('common:editor.unsaved.leave')}
    confirmStay={t('common:editor.unsaved.stay')}
    frontmatter={frontmatter}
  />
</form>

{#snippet frontmatter()}
  <label>
    {t('entries:thread.title')}
    <input
      type="text"
      name="title"
      disabled={saving}
      placeholder={t('entries:thread.placeholders.title')}
      value={thread?.title || ''}
    />
  </label>

  <ChannelSelect
    channels={channels}
    channelKey={channelKey}
    disabled={saving}
  />

  <AddFilesButton
    accept="image/*"
    multiple={true}
    addFiles={onAddFiles}
    disabled={saving}
  />

  {#if previews.length}
    <section class="attachments">
      <CnLightbox
        images={previews}
        openLabel={t('actions:openImage')}
        closeLabel={t('actions:close')}
      />
    </section>
  {/if}

  {#if tags.length > 0}
    <section class="flex elevation-1 p-1">
      {#each tags as tag}
        <span class="cn-tag">{tag}</span>
      {/each}
    </section>
  {/if}

  <section class="actions text-end">
    {#if thread?.key}
      <button type="button" disabled={saving} class="text">
        {t('actions:delete')}
      </button>
    {/if}
    <button type="button" disabled={saving} class="text" onclick={cancel}>
      {t('actions:cancel')}
    </button>
    <button type="submit" disabled={saving || !dirty} data-testid="send-thread-button">
      {#if saving}
        <CnLoader inline noun="send" />
      {:else}
        <CnIcon noun="send" />
      {/if}
      <span>{t('actions:send')}</span>
    </button>
  </section>
{/snippet}

<style>
  /*
   * The previews answer the region holding them rather than a width of their
   * own: the region is the small measure beside the canvas and the full page
   * stacked above it, and a lightbox sized for one reads wrong in the other.
   */
  .attachments {
    container: images / inline-size;
  }

  .actions {
    margin-block-start: var(--cn-line);
  }
</style>
