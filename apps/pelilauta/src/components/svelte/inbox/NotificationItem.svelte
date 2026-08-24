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
  /* ======================================================================
   *
   *   ##   ##   #####   ######   ##   ##  ######   ##   ##   ######
   *   ##   ##  ##   ##  ##   ##  ###  ##    ##     ###  ##  ##
   *   ## # ##  #######  ######   ## # ##    ##     ## # ##  ##  ###
   *   #######  ##   ##  ##  ##   ##  ###    ##     ##  ###  ##   ##
   *   ##   ##  ##   ##  ##   ##  ##   ##  ######   ##   ##   ######
   *
   *   THIS IS NOT THE v19+ DESIGN LANGUAGE.
   *
   *   It is a v21 hotfix: the design system has no listing row yet, and this
   *   page needs one to work. The layout below is this component's
   *   invention; a design-system capability would publish it, and none does.
   *
   *   Do not copy it into another component, and do not read it as the
   *   pattern for a row. Delete this block when the system publishes a
   *   listing row, and let the row compose that instead.
   *
   * ====================================================================== */

  /*
   * The row: an icon, the message, and the one action the row's read state
   * offers. Padding is the surface's, and the rhythm between rows is the
   * content container's, so neither is restated here.
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
