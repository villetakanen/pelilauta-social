<script lang="ts">
/**
 * ThreadChatBar — the reply a reader writes to a thread, mounted in chrome.
 *
 * The bar stands wherever the thread does, so answering costs no navigation and
 * no dialog: a signed-in reader always has somewhere to type. A reader who is
 * not signed in is invited to the discussion in the document instead, which
 * `DiscussionSection.svelte` renders at the end of the replies.
 *
 * The write path is v18's, untouched: `submitReply` posts the draft and its
 * files to `/api/threads/add-reply`, and the discussion's subscription
 * brings the reply back. This component decides only what happens to the draft
 * afterwards — cleared where the write succeeded, kept where it failed, so a
 * failure costs the reader nothing they typed.
 */
import CnChatBar from '@design-system/components/CnChatBar.svelte';
import CnLightbox from '@design-system/components/CnLightbox.svelte';
import Icon from '@design-system/components/Icon.svelte';
import { submitReply } from 'src/firebase/client/threads/submitReply';
import type { Thread } from 'src/schemas/ThreadSchema';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { authUser, sessionState } from '../../../stores/session';

interface Props {
  thread: Thread;
}
const { thread }: Props = $props();

let value = $state('');
let files = $state<File[]>([]);
let sending = $state(false);
let error = $state<string | null>(null);
let fileInput = $state<HTMLInputElement | null>(null);

const signedIn = $derived($authUser && $sessionState === 'active');
const sendable = $derived(!sending && value.trim().length > 0);

const previews = $derived(
  files.map((file) => ({ src: URL.createObjectURL(file), caption: file.name })),
);

/** The regions the bar shows above its row, where there is anything to show. */
const hasSupporting = $derived(files.length > 0 || error !== null);

function addFiles(event: Event) {
  const chosen = (event.target as HTMLInputElement).files;
  if (chosen) files = [...files, ...Array.from(chosen)];
  // So choosing the same file twice still reports a change.
  if (fileInput) fileInput.value = '';
}

async function send() {
  if (!sendable) return;
  sending = true;
  error = null;

  try {
    await submitReply(thread, value, '', files);
    value = '';
    files = [];
  } catch (err) {
    logError('ThreadChatBar', 'Failed to send a reply:', err);
    error =
      err instanceof Error ? err.message : t('threads:discussion.sendFailed');
  } finally {
    sending = false;
  }
}
</script>

{#snippet supporting()}
  {#if error}
    <p class="error-message">
      <Icon noun="info" />
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
    <Icon noun="assets" decorative />
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
    <Icon noun="send" decorative />
  </button>
{/snippet}

{#if signedIn}
  <CnChatBar
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
  .error-message {
    display: flex;
    align-items: center;
    gap: var(--cn-grid);
    margin: 0;
    color: var(--cn-color-error);
  }
</style>
