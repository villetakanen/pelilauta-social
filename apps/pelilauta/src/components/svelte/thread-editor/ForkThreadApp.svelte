<script lang="ts">
/**
 * Forking a reply into its own thread — a quoted-reply variant of thread
 * authoring.
 *
 * As `ThreadEditorForm`, this view is a consumer of the editor shell: it
 * slots the frontmatter — title, channel, the quoted reply — and the shell
 * decides the geometry and whether the document is dirty. It also
 * cross-posts a link back into the original thread once the fork saves,
 * which is this route's one departure from `ThreadEditorForm`'s save path.
 */
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnEditorShell from '@editor/CnEditorShell.svelte';
import { submitReply } from 'src/firebase/client/threads/submitReply';
import { CHANNEL_DEFAULT_SLUG, type Channels } from 'src/schemas/ChannelSchema';
import type { Reply } from 'src/schemas/ReplySchema';
import type { Thread } from 'src/schemas/ThreadSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { extractTags } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { logDebug, logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import MarkdownContent from '../app/MarkdownContent.svelte';
import ProfileLink from '../app/ProfileLink.svelte';
import ChannelSelect from './ChannelSelect.svelte';
import { submitThreadUpdate } from './submitThreadUpdate';

interface Props {
  thread: Thread;
  reply: Reply;
  channels: Channels;
}
const { thread, reply, channels }: Props = $props();

// Uncontrolled defaults for the title and channel fields; FormData reads
// their edited values at submit, as ThreadEditorForm's fields do.
const initialTitle = `Re: ${thread.title}`;
const initialChannel =
  thread?.channel?.toLocaleLowerCase() || CHANNEL_DEFAULT_SLUG;

let markdownContent = $state('');
let saving = $state(false);

/*
 * The shell tracks dirtiness; this component only reports it: title and
 * channel are native controls inside the region it reads, so a field edited
 * back to its original value leaves the send action disabled, which a
 * set-once flag never managed.
 */
let shell: CnEditorShell | undefined = $state();
let dirty = $state(false);

async function onsubmit(e: Event) {
  e.preventDefault();
  if (saving || !dirty) {
    return;
  }
  saving = true;
  logDebug('ForkThreadApp', 'onsubmit', e);
  const form = new FormData(e.target as HTMLFormElement);
  const data: Partial<Thread> = {
    title: form.get('title') as string,
    channel: form.get('channel') as string,
    markdownContent,
    quoteRef: `${thread.key}/${reply.key}`,
    tags: extractTags(markdownContent),
    owners: [$uid],
  };

  try {
    const slug = await submitThreadUpdate(data);

    await submitReply(
      thread,
      `${t('threads:fork.crossPost')} [${data.title}](/threads/${slug})`,
    );

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

function onContentChange(content: string) {
  markdownContent = content;
}

/*
 * Cancel is a departure, so it asks the shell, which answers for whether the
 * writer needs asking first and leaves through the route's one handler.
 */
function cancel() {
  shell?.requestBack();
}
</script>

<form {onsubmit}>
  <CnEditorShell
    bind:this={shell}
    bind:value={markdownContent}
    name="markdownContent"
    disabled={saving}
    placeholder={t('entries:thread.placeholders.content')}
    onChange={onContentChange}
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
      name="title"
      type="text"
      value={initialTitle}
      disabled={saving}
      placeholder={t('entries:thread.placeholders.title')}
    />
  </label>

  <ChannelSelect
    channels={channels}
    channelKey={initialChannel}
    disabled={saving}
  />

  <div class="mb-2">
    <p>{t('threads:fork.quoted')}</p>
    <div class="surface clip-after-3">
      <p class="m-0">
        <ProfileLink uid={reply.owners[0]} />
      </p>
      <p class="downscaled">
        <MarkdownContent content={`${reply.markdownContent}`} />
      </p>
    </div>
  </div>

  <section class="actions text-end">
    <button type="button" disabled={saving} class="text" onclick={cancel}>
      {t('actions:cancel')}
    </button>
    <button type="submit" disabled={saving || !dirty}>
      <CnIcon noun="send" />
      <span>{t('actions:send')}</span>
    </button>
  </section>
{/snippet}

<style>
  .actions {
    margin-block-start: var(--cn-line);
  }
</style>
