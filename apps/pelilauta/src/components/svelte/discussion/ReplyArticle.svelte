<script lang="ts">
import CnBubble from '@design-system/components/CnBubble.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLightbox from '@design-system/components/CnLightbox.svelte';
import CnMenu from '@design-system/components/CnMenu.svelte';
import { marked } from 'marked';
import type { Reply } from 'src/schemas/ReplySchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { getProfileAtom } from '../../../stores/profiles';
import { editedReply, editReply } from '../../../stores/replyEditing';
import { uid } from '../../../stores/session';
import ProfileLink from '../app/ProfileLink.svelte';
import ReactionButton from '../app/ReactionButton.svelte';

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

/**
 * The edit action hands the reply to the thread's chat bar and takes the focus
 * with it. When the edit ends the focus comes back to the menu's trigger, not
 * to the action itself: the action is a row on a closed popover by then, and a
 * closed popover is `display: none`, which cannot take focus. The trigger is
 * the control the reader pressed to reach the action, and it is always in the
 * document.
 *
 * A reader who left this edit by starting another one keeps their focus in the
 * bar, where the other reply now is, so only an edit that ended outright
 * returns it here.
 */
let root = $state<HTMLElement | null>(null);
let editingHere = $derived($editedReply?.key === reply.key);
let wasEditingHere = $state(false);

$effect(() => {
  if (editingHere) {
    wasEditingHere = true;
    return;
  }
  if (!wasEditingHere) return;

  wasEditingHere = false;
  if ($editedReply === null) {
    root?.querySelector<HTMLElement>('.cn-menu-trigger')?.focus();
  }
});
</script>

<!-- The id is the anchor a link to a single reply lands on. -->
<div id={reply.key} bind:this={root}>
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
          <CnIcon noun="fork" decorative />
          <span>{t("actions:fork")}</span>
        </a>
        {#if fromUser}
          <button type="button" onclick={() => editReply(reply)}>
            <CnIcon noun="edit" decorative />
            <span>{t("actions:edit")}</span>
          </button>
          <a href={`/threads/${reply.threadKey}/replies/${reply.key}/delete`}>
            <CnIcon noun="delete" decorative />
            <span>{t("actions:delete")}</span>
          </a>
        {/if}
      </CnMenu>
    </header>
    <div class="text-prose">
      <CnLightbox
        {images}
        openLabel={t("actions:openImage")}
        closeLabel={t("actions:close")}
      />
      {@html marked(reply.markdownContent || "")}
    </div>
    {#if reply.updatedAt}
      <footer class="text-end">
        <span class="text-small text-low">
          {displayTime}
        </span>
      </footer>
    {/if}
  </CnBubble>
</div>

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

  .reply-author {
    flex: 1 1 auto;
    margin-block: 0;
  }
</style>
