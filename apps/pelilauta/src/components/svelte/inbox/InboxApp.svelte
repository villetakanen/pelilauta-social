<script lang="ts">
import { t } from 'src/utils/i18n';
import { newCount, notifications } from '../../../stores/inbox';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';
import NotificationItem from './NotificationItem.svelte';

/**
 * A micro frontend that renders the inbox page, and allows the user to view and manage their messages.
 */
</script>

<div class="content-prose">
  <WithAuth allow={!!$uid}>
    <h1>{t('social:inbox.title')}</h1>
    <p>{t('social:inbox.description')}</p>

      {#each $notifications as note}
        <NotificationItem notification={note} />
      {/each}
      <p class="mb-0 text-right">
        {$newCount} {t('social:inbox.notificationCount')}
      </p>
  </WithAuth>
</div>
