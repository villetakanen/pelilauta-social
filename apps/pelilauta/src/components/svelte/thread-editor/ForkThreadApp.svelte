<script lang="ts">
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
import CodeMirrorEditor from '../CodeMirrorEditor/CodeMirrorEditor.svelte';
import ChannelSelect from './ChannelSelect.svelte';
import { submitThreadUpdate } from './submitThreadUpdate';

interface Props {
  thread: Thread;
  reply: Reply;
  channels: Channels;
}
const { thread, reply, channels }: Props = $props();
let title = $state(`Re: ${thread.title}`);
let channel = $state(
  thread?.channel?.toLocaleLowerCase() || CHANNEL_DEFAULT_SLUG,
);
let markdownContent = $state('');
let saving = $state(false);
let changed = $state(false);

function reset() {
  title = `Re: ${thread.title}`;
  channel = thread?.channel?.toLocaleLowerCase() || CHANNEL_DEFAULT_SLUG;
  markdownContent = '';
}

async function onsubmit(e: Event) {
  e.preventDefault();
  if (saving || !changed) {
    return;
  }
  saving = true;
  logDebug('ForkThreadApp', 'onsubmit', e);
  const data: Partial<Thread> = {
    title,
    channel,
    markdownContent,
    quoteRef: `${thread.key}/${reply.key}`,
    tags: extractTags(markdownContent),
    owners: [$uid],
  };

  try {
    const slug = await submitThreadUpdate(data);

    await submitReply(
      thread,
      `${t('threads:fork.crossPost')} [${title}](/threads/${slug})`,
    );

    saving = false;
    window.location.href = `/threads/${slug}`;
  } catch (error) {
    logError('Error saving thread', error);
    pushSnack(t('threads:editor.error.save'));
    saving = false;
  }
}

function onChannelChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  const selectedChannel = select.value;
  if (selectedChannel !== channel) {
    handleChange();
  }
}
function onContentChange(event: CustomEvent<string>) {
  markdownContent = event.detail;
  handleChange();
}
function onTitleChange(event: Event) {
  const input = event.target as HTMLInputElement;
  title = input.value;
  handleChange();
}

function handleChange() {
  changed = true;
}
</script>

<form class="content-editor" {onsubmit}>
  <div class="toolbar">
    <label class="grow">
      {t('entries:thread.title')}
      <input
        name="title"
        type="text"
        value={title}
        disabled={saving}
        oninput={onTitleChange}
        placeholder={t('entries:thread.placeholders.title')}
      />
    </label>
    <ChannelSelect 
      channels={channels}
      channelKey={channel}
      disabled={saving}
      onchange={onChannelChange}
    />
  </div>

  <div class="mb-2">
    <p>{t('threads:fork.quoted')}</p>
    <div class="elevation-1 border-radius p-1 clip-after-3 secondary">
      <p class="m-0">
        <ProfileLink uid={reply.owners[0]} />
      </p>
      <p class="downscaled">
        <MarkdownContent content={`${reply.markdownContent}`} />
      </p>
    </div>
  </div>

  <section class="grow">
    <CodeMirrorEditor
      bind:value={markdownContent}
      name="markdownContent"
      disabled={saving}
      oninput={onContentChange}
      placeholder={t('entries:thread.placeholders.content')}
    />
  </section>

    <div class="toolbar">
      <button type="reset" class="text">
        {t('actions:cancel')}
      </button>
      <span>
        debug: {JSON.stringify({ changed, saving })}
      </span>
      <button type="submit">
        <cn-icon noun="send"></cn-icon>
        <span>{t('actions:send')}</span>
      </button>
    </div>
  </form>
