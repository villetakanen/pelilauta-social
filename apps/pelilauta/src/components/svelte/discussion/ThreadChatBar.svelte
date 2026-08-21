<script lang="ts">
/**
 * ThreadChatBar — the reply a reader writes to a thread, mounted in chrome.
 *
 * The bar stands wherever the thread does, so answering costs no navigation and
 * no dialog: a signed-in reader always has somewhere to type. A reader who is
 * not signed in is invited to the discussion in the document instead, which
 * `DiscussionSection.svelte` renders at the end of the replies.
 *
 * One bar writes and edits. Editing arrives through `stores/replyEditing`: the
 * bar takes the reply's text, and the draft the reader had waits where it was
 * until the edit ends. Sending performs whichever of the two is open.
 *
 * The write paths are v18's, untouched: `submitReply` posts a new reply and its
 * files to `/api/threads/add-reply`, `updateReply` writes an existing one, and
 * the discussion's subscription brings either back. This component decides only
 * what happens to the draft afterwards — cleared where the write succeeded,
 * kept where it failed, so a failure costs the reader nothing they typed.
 */
import CnChatBar from '@design-system/components/CnChatBar.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLightbox from '@design-system/components/CnLightbox.svelte';
import { submitReply } from 'src/firebase/client/threads/submitReply';
import { updateReply } from 'src/firebase/client/threads/updateReply';
import type { Thread } from 'src/schemas/ThreadSchema';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { editedReply, endEditing } from '../../../stores/replyEditing';
import { authUser, sessionState } from '../../../stores/session';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();

let bar = $state<ReturnType<typeof CnChatBar>>();
let value = $state('');
let files = $state<File[]>([]);
let sending = $state(false);
let error = $state<string | null>(null);
let fileInput = $state<HTMLInputElement | null>(null);

/** The draft the reader had, held while an edit borrows the bar. */
let heldDraft = $state('');
let heldFiles = $state<File[]>([]);

const signedIn = $derived($authUser && $sessionState === 'active');
const editing = $derived(
  $editedReply?.threadKey === thread.key ? $editedReply : null,
);
const sendable = $derived(!sending && value.trim().length > 0);

const previews = $derived(
  files.map((file) => ({ src: URL.createObjectURL(file), caption: file.name })),
);

/** The regions the bar shows above its row, where there is anything to show. */
const hasSupporting = $derived(
  files.length > 0 || error !== null || editing !== null,
);

/** The caret follows the reader here, from the action they pressed. */
let editingKey = $state<string | null>(null);

$effect(() => {
  const key = editing?.key ?? null;
  if (key === editingKey) return;

  if (key && !editingKey) {
    heldDraft = value;
    heldFiles = files;
  }

  editingKey = key;
  error = null;

  if (editing) {
    value = editing.markdownContent || '';
    files = [];
    bar?.focus();
  } else {
    value = heldDraft;
    files = heldFiles;
    heldDraft = '';
    heldFiles = [];
  }
});

function addFiles(event: Event) {
  const chosen = (event.target as HTMLInputElement).files;
  if (chosen) files = [...files, ...Array.from(chosen)];
  // So choosing the same file twice still reports a change.
  if (fileInput) fileInput.value = '';
}

async function send() {
  if (!sendable) return;
  const edited = editing;
  sending = true;
  error = null;

  try {
    if (edited) {
      await updateReply(edited.threadKey, edited.key, value, files);
      endEditing();
    } else {
      await submitReply(thread, value, '', files);
      value = '';
      files = [];
    }
  } catch (err) {
    logError('ThreadChatBar', 'Failed to write a reply:', err);
    error =
      err instanceof Error
        ? err.message
        : t(
            edited
              ? 'threads:discussion.editFailed'
              : 'threads:discussion.sendFailed',
          );
  } finally {
    sending = false;
  }
}
</script>

{#snippet supporting()}
  {#if editing}
    <p class="editing-note">
      <CnIcon noun="edit" decorative />
      <span>{t("threads:discussion.editing")}</span>
      <button type="button" class="text" onclick={endEditing} disabled={sending}>
        {t("actions:cancel")}
      </button>
    </p>
  {/if}
  {#if error}
    <p class="error-message">
      <CnIcon noun="info" decorative />
      <span>{error}</span>
    </p>
  {/if}
  {#if previews.length}
    <CnLightbox
      images={previews}
      openLabel={t("actions:openImage")}
      closeLabel={t("actions:close")}
    />
  {/if}
{/snippet}

{#snippet menu()}
  <button type="button" onclick={() => fileInput?.click()}>
    <CnIcon noun="assets" decorative />
    <span>{t("actions:upload")}</span>
  </button>
{/snippet}

{#snippet trailing()}
  <button
    type="button"
    class="chrome-action"
    aria-label={t("actions:send")}
    disabled={!sendable}
    onclick={send}
  >
    <CnIcon noun="send" decorative />
  </button>
{/snippet}

{#if signedIn}
  <CnChatBar
    bind:this={bar}
    bind:value
    label={t("threads:discussion.reply")}
    placeholder={t("entries:reply.placeholders.markdownContent")}
    menuLabel={t("actions:add")}
    disabled={sending}
    onsend={send}
    supporting={hasSupporting ? supporting : undefined}
    {menu}
    {trailing}
  />

  <input
    type="file"
    accept="image/*"
    multiple
    hidden
    bind:this={fileInput}
    onchange={addFiles}
    data-testid="file-input"
  />
{/if}

<style>
  .editing-note,
  .error-message {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
    margin: 0;
  }

  .error-message {
    color: var(--cn-color-error);
  }
</style>
