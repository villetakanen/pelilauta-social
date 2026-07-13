<script lang="ts">
import { updateReply } from 'src/firebase/client/threads/updateReply';
import type { Reply } from 'src/schemas/ReplySchema';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import AddFilesButton from '../app/AddFilesButton.svelte';

interface Props {
  reply: Reply;
}
const { reply }: Props = $props();
let replyContent = $state<string>(reply.markdownContent || '');
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

export function showDialog() {
  // Reset content to current reply content when opening
  replyContent = reply.markdownContent || '';
  files = [];
  error = null;
  isOpen = true;
}

function handleClose() {
  isOpen = false;
  changed = false;
  saving = false;
  error = null;
}

async function handleSave() {
  // Don't close dialog yet - keep it open during save
  saving = true;
  error = null;

  // Update replyContent from DOM if possible (fix for binding issues)
  if (textareaRef) {
    replyContent = textareaRef.value;
  }

  try {
    await updateReply(reply.threadKey, reply.key, replyContent, files);

    // Only close dialog on successful save
    handleClose();
    // Ideally we should trigger a reload or update the UI here.
    // For MVP, a page reload might be simplest, or relying on Firestore real-time updates if subscribed.
    // Assuming the parent component or page handles real-time updates or we reload.
    // Let's reload for now to be safe and simple as per PBI "without a page refresh (or with a refresh if easier for MVP)"
    // Actually, if we are using Firestore subscriptions, it should update automatically.
    // If not, we might need to reload.
    // Let's try without reload first, assuming subscription.
  } catch (err) {
    // Log the error for debugging
    logError('EditReplyDialog', 'Failed to update reply:', err);

    // Show user-friendly error but keep dialog open so user can retry
    error =
      err instanceof Error
        ? err.message
        : 'Failed to update reply. Please try again.';
    saving = false;
  }
}
</script>

{#if isOpen}
    <cn-reply-dialog open={isOpen} onclose={handleClose}>
        <span slot="header">{t("actions:edit")}</span>

        <div class="reply-content">
            {#if error}
                <div
                    class="error-message"
                    style="background: var(--cn-color-error-bg, #fee); color: var(--cn-color-error, #c00); padding: var(--cn-gap-xs); border-radius: var(--cn-radius); margin-bottom: var(--cn-gap);"
                >
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
                    (replyContent = (e.currentTarget as HTMLTextAreaElement)
                        .value)}
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
            <button
                type="button"
                class="call-to-action"
                disabled={saving}
                onclick={handleSave}
            >
                {#if saving}
                    <cn-icon noun="clock"></cn-icon>
                    <span>{t("actions:saving") || "Saving..."}</span>
                {:else}
                    {t("actions:save")}
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

    .images-preview {
        container: images / inline-size;
        width: 100%;
        margin-bottom: var(--cn-gap);
    }
</style>
