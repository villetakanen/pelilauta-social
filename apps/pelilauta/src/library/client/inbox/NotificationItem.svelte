<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import ProfileLink from '@pelilauta/components/svelte/app/ProfileLink.svelte';
import type { Notification } from 'src/schemas/NotificationSchema';
import { toDisplayString } from 'src/utils/contentHelpers';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { deleteNotification } from './deleteNotification';
import { markRead } from './markRead';
import { notificationHref } from './notificationHref';

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

const href = $derived(notificationHref(notification));

async function read() {
  markRead(notification.key, true);
}
async function remove() {
  deleteNotification(notification.key);
}
</script>

<article
  class={`notification-item surface ${notification.read ? "" : "elevation-3"}`}
>
  <CnIcon {noun} size="small" />
  <div>
    <p>
      <ProfileLink uid={notification.from} />
      {t(`social:notification.${notification.targetType}`)}
    </p>
    <p>
      {#if href}
        <a {href}>{notification.targetTitle}</a>
      {:else}
        {notification.targetTitle}
      {/if}
    </p>
    <p class="text-caption">
      {displayTime}
    </p>
  </div>

  {#if !notification.read}
    <button class="text" onclick={read} aria-label={t("actions:markRead")}>
      <CnIcon noun="check" />
    </button>
  {:else}
    <button class="text" onclick={remove} aria-label={t("actions:delete")}>
      <CnIcon noun="delete" />
    </button>
  {/if}
</article>

<style>
  /*
   * Stopgap. The design system has no listing row yet, so this layout is
   * local. Do not copy it; delete it when a listing row exists.
   * plans/debt/the-design-system-has-no-listing-row.md tracks the gap.
   */

  /*
   * The row: an icon, the message, and the one action the row's read state
   * offers. The surface carries the padding, and the content container
   * carries the rhythm between rows, so neither is restated here.
   */
  .notification-item {
    display: flex;
    align-items: start;
    gap: var(--cn-gap);
    border-radius: var(--cn-border-radius);
  }

  /* The icon and the action keep their square; the message takes the rest. */
  .notification-item > :global(.cn-icon),
  .notification-item > button {
    flex: none;
  }

  .notification-item > div {
    flex: 1;
    min-inline-size: 0;
  }
</style>
