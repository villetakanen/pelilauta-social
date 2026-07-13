<script lang="ts">
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

<style>
.user-grid {
  display: grid;
  grid-template-columns: 6fr 2fr 1fr 1fr 1fr;
  gap: var(--cn-grid);
  align-items: center;
}
</style>

<WithAuth {allow}>
  <div class="content-columns">
    <article class="column-l">
      <h1>Users</h1>
      {#await getAllAccounts()}
        <cn-loader></cn-loader>
      {:then accounts}
      <div class="user-grid">
        <div class="elevation-1 p-2">NICK</div>
        <div class="elevation-1 p-2">LAST LOGIN</div>
        <div class="elevation-1 p-2">A</div>
        <div class="elevation-1 p-2">FROZEN</div>
        {#if import.meta.env.DEV}
          <div class="elevation-1 p-2">PURGE</div>
        {/if}
        {#each accounts as account}
          <User {account} />
          {#if import.meta.env.DEV}
            <button onclick={() => purgeUser(account.uid)}>Purge</button>
          {/if}
        {/each}
        </div>
        {:catch error}
          <p>{error.message}</p>
        {/await}
    </article>
  </div>
</WithAuth>
