<script lang="ts">
import CnMenu from '@design-system/components/CnMenu.svelte';
import Icon from '@design-system/components/Icon.svelte';
import { marked } from 'marked';
import type { Reply } from 'src/schemas/ReplySchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';
import AvatarLink from '../app/AvatarLink.svelte';
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

<article
  class="flex {fromUser ? 'flex-row-reverse' : ''}"
  id={reply.key}
  aria-labelledby={`reply-author-${reply.key}`}
>
  <div class="sm-hidden flex-none" style="flex: 0 0 auto">
    <AvatarLink uid={reply.owners[0]} />
  </div>
  <cn-bubble reply={fromUser || undefined} class="grow">
    <div class="toolbar downscaled">
      <p class="grow">
        <ProfileLink uid={reply.owners[0]} id={`reply-author-${reply.key}`} />
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
    </div>
    <div>
      {#if images.length}
        <cn-lightbox {images}></cn-lightbox>
      {/if}
      {@html marked(reply.markdownContent || "")}
    </div>
    {#if reply.updatedAt}
      <div class="flex justify-end">
        <span class="text-small text-low">
          {displayTime}
        </span>
      </div>
    {/if}
  </cn-bubble>
</article>

{#if fromUser}
  <EditReplyDialog {reply} bind:this={editDialog} />
{/if}
