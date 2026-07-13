<script lang="ts">
import { submitReply } from 'src/firebase/client/threads/submitReply';
import type { Thread } from 'src/schemas/ThreadSchema';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import AddFilesButton from '../app/AddFilesButton.svelte';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();
const dialogId = `reply-dialog-${thread.key}`;
let replyContent = $state<string>('');
let files = $state<File[]>([]);
let changed = $state(false);
let saving = $state(false);
let error = $state<string | null>(null);
let isOpen = $state(false);
let textareaRef = $state<HTMLTextAreaElement | null>(null);

const previews = $derived.by(() => {
  return files.map((file) => ({
    src: URL.createObjectURL(file),
    caption: file.name,
  }));
});

function showDialog() {
  isOpen = true;
}

function handleClose() {
  isOpen = false;
  replyContent = '';
  files = [];
  changed = false;
  saving = false;
  error = null;
}

async function onsubmit(e: Event) {
  e.preventDefault();

  // Don't close dialog yet - keep it open during save
  saving = true;
  error = null;
}

async function handleSave() {
  saving = true;
  error = null;

  // Update replyContent from DOM if possible (fix for binding issues)
  if (textareaRef) {
    replyContent = textareaRef.value;
  }

  try {
    if (!thread?.key) throw new Error('Thread key is missing');
    if (!replyContent) throw new Error('Reply content is missing');

    await submitReply(thread, replyContent, '', files);

    // Only close dialog on successful save
    handleClose();
  } catch (err) {
    // Log the error for debugging
    logError('ReplyDialog', 'Failed to save reply:', err);

    // Show user-friendly error but keep dialog open so user can retry
    error =
      err instanceof Error
        ? err.message
        : 'Failed to save reply. Please try again.';
    saving = false;
  }
}
</script>

<div class="toolbar items-center">
  <button type="button" onclick={showDialog}>
    <cn-icon noun="send"></cn-icon>
    <span>{t("threads:discussion.reply")}</span>
  </button>
</div>

{#if isOpen}
  <cn-reply-dialog open={isOpen} onclose={handleClose}>
    <span slot="header">{t("threads:discussion.reply")}</span>

    <div class="reply-content">
      {#if error}
        <div class="error-message">
          <cn-icon noun="info"></cn-icon>
          <span>{error}</span>
        </div>
      {/if}

      {#if files.length > 0}
        <section class="images-preview">
          <cn-lightbox images={previews}></cn-lightbox>
        </section>
      {/if}

      <textarea
        placeholder={t("entries:reply.placeholders.markdownContent")}
        rows="5"
        name="reply"
        required
        class="reply-textarea"
        bind:this={textareaRef}
        bind:value={replyContent}
        oninput={(e) =>
          (replyContent = (e.currentTarget as HTMLTextAreaElement).value)}
        autofocus
      ></textarea>
    </div>

    <div slot="actions" class="toolbar">
      <AddFilesButton
        accept="image/*"
        multiple={true}
        addFiles={(newFiles: File[]) => {
          files = [...files, ...newFiles];
          changed = true;
        }}
        disabled={saving}
      />
      <div class="grow"></div>
      <button
        type="button"
        class="text"
        onclick={handleClose}
        disabled={saving}
      >
        {t("actions:cancel")}
      </button>
      <button type="button" disabled={saving} onclick={handleSave}>
        {#if saving}
          <cn-icon noun="send"></cn-icon>
          <span>{t("actions:send")}</span>
        {:else}
          <cn-icon noun="send"></cn-icon>
          <span>{t("actions:send")}</span>
        {/if}
      </button>
    </div>
  </cn-reply-dialog>
{/if}

<style>
  .reply-textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
  }

  .error-message {
    background: var(--cn-color-error-bg, #fee);
    color: var(--cn-color-error, #c00);
    padding: var(--cn-gap-xs);
    border-radius: var(--cn-radius);
    margin-bottom: var(--cn-gap);
    display: flex;
    align-items: center;
    gap: var(--cn-gap-xs);
  }

  .images-preview {
    container: images / inline-size;
    width: 100%;
    margin-bottom: var(--cn-gap);
  }
</style>
