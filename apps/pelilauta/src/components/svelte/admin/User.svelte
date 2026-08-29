<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnToggle from '@design-system/components/CnToggle.svelte';
import { setFrozen } from 'src/firebase/client/account/setFrozen';
import type { Account } from 'src/schemas/AccountSchema';
import { appMeta } from 'src/stores/metaStore/metaStore';
import { toDisplayString } from 'src/utils/contentHelpers';
import ProfileLink from '../app/ProfileLink.svelte';

interface Props {
  account: Account;
}
const { account }: Props = $props();
const adminStatus = $derived(() => $appMeta.admins.includes(account.uid));
const frozenStatus = $derived(() => account.frozen);

const toggleFrozen = async (e: Event & { currentTarget: HTMLInputElement }) => {
  account.frozen = e.currentTarget.checked;
  await setFrozen(account.frozen, account.uid);
};
</script>

<div class="user-cell user-identity">
  <ProfileLink uid={account.uid} />
  <span class="text-caption text-low">{account.uid}</span>
</div>

<div class="user-cell text-small text-low">
  {toDisplayString(account.lastLogin)}
</div>

<div class="user-cell text-center">
  {#if adminStatus()}
    <span title="Administrator">
      <CnIcon noun="admin" />
    </span>
  {/if}
</div>

<div class="user-cell text-center">
  <CnToggle
    label="Frozen"
    disabled={adminStatus()}
    checked={frozenStatus() ?? false}
    onchange={toggleFrozen}
  />
</div>

<style>
  .user-cell {
    padding-block: calc(var(--cn-grid) * 0.5);
  }

  .user-identity {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
</style>

