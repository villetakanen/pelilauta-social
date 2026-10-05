<script lang="ts">
import CnBubble from '@design-system/components/CnBubble.svelte';
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnLightbox from '@design-system/components/CnLightbox.svelte';
import CnMenu from '@design-system/components/CnMenu.svelte';
import ReactionButton from '@svelte/app/ReactionButton.svelte';
import { marked } from 'marked';
import type { Reply } from 'src/schemas/ReplySchema';
import { getProfileAtom, type PublicProfile } from 'src/stores/profiles';
import { editedReply, editReply } from 'src/stores/replyEditing';
import { uid } from 'src/stores/session';
import { isResolvedActive } from 'src/stores/session/computed';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';

interface Props {
  reply: Reply;
  /** The server's answer for the author, present for every author in the initial document. */
  author?: PublicProfile;
}
const { reply, author: initAuthor }: Props = $props();
const fromUser = $derived.by(() => {
  return reply.owners[0] === $uid;
});

/**
 * The bubble draws the identity mark, so this is the profile the mark is drawn
 * from. The nick is also in the header, which is what names the author; the
 * mark repeats it and the bubble drops it in a narrow column.
 *
 * The server resolves the authors of the initial document, so the document
 * names them and the browser reads no profile. Only a reply that arrives live
 * from an author the server never saw has no prop, and looks the profile up
 * after mount: the profile store starts a client Firestore read and keeps its
 * result in module state, and the server render must do neither.
 *
 * The prop is read where it is used, so the mark follows the reply the
 * component currently shows. The looked-up profile fills in only when the
 * prop is absent.
 */
let lookedUp = $state<PublicProfile | undefined>();
const author = $derived(initAuthor ?? lookedUp);

const images = $derived.by(() => {
  return (
    reply.images?.map((image) => ({
      src: image.url,
      caption: image.alt,
    })) || []
  );
});

// The server renders the absolute time; after mount the time turns relative.
let relativeTime = $state(false);
const displayTime = $derived(toDisplayString(reply.updatedAt, relativeTime));

onMount(() => {
  // Client-Side enhancement: update to relative time
  relativeTime = true;

  if (initAuthor) return;
  return getProfileAtom(reply.owners[0]).subscribe((profile) => {
    lookedUp = profile;
  });
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
        {#if author}
          <a class="cn-nick" href="/profiles/{author.key}">{author.nick}</a>
        {/if}
      </p>
      <!-- ReactionButton reads its reaction document on mount, so mount it only once Firebase confirms an active session. -->
      {#if $isResolvedActive}
        <ReactionButton
          target="reply"
          small
          key={reply.key}
          title={reply.markdownContent?.substring(0, 50)}
        ></ReactionButton>
      {/if}
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
    <div class="content-area">
      <CnLightbox
        {images}
        openLabel={t("actions:openImage")}
        closeLabel={t("actions:close")}
      />
      {@html marked(reply.markdownContent || "")}
    </div>
    {#if reply.updatedAt}
      <footer class="text-end">
        <a
          class="text-small text-low"
          href={`/threads/${reply.threadKey}#${reply.key}`}
          aria-label={t("threads:discussion.permalink")}
        >
          {displayTime}
        </a>
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
