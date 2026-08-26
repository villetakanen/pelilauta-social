<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
import { pushSnack } from '@utils/client/snackUtils';
import { logError } from '@utils/logHelpers';
import { getAllAccounts } from 'src/firebase/client/admin/getAllAccounts';
import { authedPost } from 'src/firebase/client/apiClient';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { uid as adminUid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';
import User from './User.svelte';

const allow = $derived.by(() => $appMeta.admins.includes($adminUid));

async function purgeUser(uid: string) {
  if (
    confirm(`Are you sure you want to purge user ${uid}? This is irreversible.`)
  ) {
    try {
      const response = await authedPost('/api/admin/purge-user', { uid });
      if (response.ok) {
        window.location.reload();
      } else {
        pushSnack('Failed to purge user.');
      }
    } catch (error) {
      logError('purgeUser', 'Error purging user', error);
      pushSnack('An error occurred while purging the user.');
    }
  }
}
</script>

<WithAuth {allow}>
  <article class="surface user-admin-card">
    <header>
      <h1>Users</h1>
      <p class="text-small text-low">Registered user accounts and moderation controls</p>
    </header>

    {#await getAllAccounts()}
      <div class="loading-box">
        <CnLoader />
      </div>
    {:then accounts}
      <div class="user-grid-table {import.meta.env.DEV ? 'has-dev-actions' : ''}">
        <div class="grid-th">Nick / UID</div>
        <div class="grid-th">Last Login</div>
        <div class="grid-th text-center">Role</div>
        <div class="grid-th text-center">Status</div>
        {#if import.meta.env.DEV}
          <div class="grid-th text-center">Actions</div>
        {/if}

        {#each accounts as account}
          <User {account} />
          {#if import.meta.env.DEV}
            <div class="grid-td text-center">
              <button type="button" class="text" onclick={() => purgeUser(account.uid)}>Purge</button>
            </div>
          {/if}
        {/each}
      </div>
    {:catch error}
      <div class="surface error">
        <p>{error.message}</p>
      </div>
    {/await}
  </article>
</WithAuth>

<style>
  .user-admin-card {
    display: grid;
    row-gap: var(--cn-line);
  }

  .loading-box {
    display: flex;
    justify-content: center;
    padding-block: var(--cn-line);
  }

  .user-grid-table {
    display: grid;
    grid-template-columns: 3fr 2fr 1fr 1fr;
    gap: var(--cn-grid);
    align-items: center;
  }

  .user-grid-table.has-dev-actions {
    grid-template-columns: 3fr 2fr 1fr 1fr 1fr;
  }

  .grid-th {
    font-size: var(--cn-font-size-caption);
    color: var(--cn-color-text-low);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    padding-block-end: calc(var(--cn-grid) * 0.5);
    border-block-end: 1px solid var(--cn-color-border);
  }

  .grid-td {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
