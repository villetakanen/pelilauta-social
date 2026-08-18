<script lang="ts">
import CnBubble from '@design-system/components/CnBubble.svelte';
import CnMenu from '@design-system/components/CnMenu.svelte';
import Icon from '@design-system/components/Icon.svelte';
import { marked } from 'marked';
import type { Reply } from 'src/schemas/ReplySchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { getProfileAtom } from '../../../stores/profiles';
import { uid } from '../../../stores/session';
import ProfileLink from '../app/ProfileLink.svelte';
import ReactionButton from '../app/ReactionButton.svelte';
import EditReplyDialog from './EditReplyDialog.svelte';

interface Props {
  reply: Reply;
}
const { reply }: Props = $props();
const fromUser = $derived.by(() => {
  return reply.owners[0] === $uid;
});

/**
 * The bubble draws the identity mark, so this is the profile the mark is drawn
 * from. The nick is also in the header, through ProfileLink, which is what names
 * the author; the mark repeats it and the bubble drops it in a narrow column.
 */
const authorAtom = getProfileAtom(reply.owners[0]);
const author = $derived($authorAtom);

const images = $derived.by(() => {
  return (
    reply.images?.map((image) => ({
      src: image.url,
      caption: image.alt,
    })) || []
  );
});

let displayTime = $state(toDisplayString(reply.updatedAt));

onMount(() => {
  // Client-Side enhancement: update to relative time
  displayTime = toDisplayString(reply.updatedAt, true);
});

let editDialog = $state<ReturnType<typeof EditReplyDialog>>();
</script>

<!-- The id is the anchor a link to a single reply lands on. -->
<div id={reply.key}>
  <CnBubble
    reply={fromUser}
    nick={author?.nick ?? ''}
    avatar={author?.avatarURL ?? ''}
  >
    <header class="reply-band">
      <p class="reply-author">
        <ProfileLink uid={reply.owners[0]} />
      </p>
      <ReactionButton
        target="reply"
        small
        key={reply.key}
        title={reply.markdownContent?.substring(0, 50)}
      ></ReactionButton>
      <CnMenu inline label={t("actions:moreOptions")}>
        <a href={`/threads/${reply.threadKey}/replies/${reply.key}/fork`}>
          <Icon noun="fork" decorative />
          <span>{t("actions:fork")}</span>
        </a>
        {#if fromUser}
          <button type="button" onclick={() => editDialog?.showDialog()}>
            <Icon noun="edit" decorative />
            <span>{t("actions:edit")}</span>
          </button>
          <a href={`/threads/${reply.threadKey}/replies/${reply.key}/delete`}>
            <Icon noun="delete" decorative />
            <span>{t("actions:delete")}</span>
          </a>
        {/if}
      </CnMenu>
    </header>
    <div>
      {#if images.length}
        <cn-lightbox {images}></cn-lightbox>
      {/if}
      {@html marked(reply.markdownContent || "")}
    </div>
    {#if reply.updatedAt}
      <footer class="reply-band reply-band--end">
        <span class="text-small text-low">
          {displayTime}
        </span>
      </footer>
    {/if}
  </CnBubble>
</div>

{#if fromUser}
  <EditReplyDialog {reply} bind:this={editDialog} />
{/if}

<style>
  /*
   * The bands are rows inside the bubble, which releases the padding a leading
   * header and a trailing footer sit in. Cyan's `.toolbar` carried its own padding
   * and a bridge rule cancelled it; the band sets its layout here instead, so the
   * bubble's edges are the only thing positioning it.
   */
  .reply-band {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .reply-band--end {
    justify-content: flex-end;
  }

  .reply-author {
    flex: 1 1 auto;
    margin-block: 0;
  }
</style>
