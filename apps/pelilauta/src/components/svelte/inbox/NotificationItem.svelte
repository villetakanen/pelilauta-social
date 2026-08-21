<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { deleteNotification } from 'src/firebase/client/inbox/deleteNotification';
import { markRead } from 'src/firebase/client/inbox/markRead';
import type { Notification } from 'src/schemas/NotificationSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import ProfileLink from '../app/ProfileLink.svelte';

/**
 * A Line item in the notifications list.
 */
interface Props {
  notification: Notification;
}
const { notification }: Props = $props();

let displayTime = $state(toDisplayString(notification.createdAt));

onMount(() => {
  displayTime = toDisplayString(notification.createdAt, true);
});

const noun = $derived.by(() => {
  if (notification.targetType.endsWith('.loved')) return 'love';
  if (notification.targetType.endsWith('.reply')) return 'discussion';
  if (notification.targetType.endsWith('.invited')) return 'adventurer';
  if (notification.targetType.startsWith('handout.')) return 'books';
  return 'info';
});

const href = $derived.by(() => {
  if (notification.targetType === 'thread.loved')
    return `/threads/${notification.targetKey}`;
  if (notification.targetType === 'site.invited')
    return `/sites/${notification.targetKey}`;
  if (notification.targetType === 'site.loved')
    return `/sites/${notification.targetKey}`;
  if (notification.targetType === 'thread.reply')
    return `/threads/${notification.targetKey}?jumpTo=unread#discussion`;
  if (notification.targetType.startsWith('handout.')) {
    const keys = notification.targetKey.split('/');
    return `/sites/${keys[0]}/handouts/${keys[1]}`;
  }
});

async function read() {
  markRead(notification.key, true);
}
async function remove() {
  deleteNotification(notification.key);
}
</script>

<article
  class={`notification-item flex flex-no-wrap mb-1 p-1 border-radius ${notification.read ? "" : "elevation-4"}`}
>
  <span class="mt-1 flex-none"><CnIcon {noun} size="small" /></span>
  <div class="grow">
    <p class="m-0">
      <ProfileLink uid={notification.from} />
      {t(`social:notification.${notification.targetType}`)}
    </p>
    <p class="m-0">
      <a {href}>{notification.targetTitle}</a>
    </p>
    <p class="m-0 text-caption">
      {displayTime}
    </p>
  </div>

  {#if !notification.read}
    <button
      class="text flex-none"
      onclick={read}
      aria-label={t("actions:markRead")}
    >
      <CnIcon noun="check" />
    </button>
  {:else}
    <button class="text flex-none" aria-label="delete" onclick={remove}>
      <CnIcon noun="delete" />
    </button>
  {/if}
</article>

<style>
  .notification-item.elevation-4,
  .notification-item.elevation-4 :global(a) {
    color: var(--cn-color-text-high);
  }

  .notification-item.elevation-4 :global(a:focus-visible) {
    outline-color: currentColor;
  }

  .notification-item.elevation-4 button.text {
    color: var(--cn-color-text-high);
  }

  .notification-item.elevation-4 button.text:focus-visible {
    outline-color: currentColor;
  }
</style>
