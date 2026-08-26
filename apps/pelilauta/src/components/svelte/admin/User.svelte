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

<p class="m-0 p-2">
  <ProfileLink uid={account.uid} /><br>
  <span class="text-caption">{account.uid}</span>
</p>
<p class="m-0 p-2">{toDisplayString(account.lastLogin)}</p>

  {#if adminStatus()}
  <div class="text-center">
    <CnIcon noun="admin" />
    </div>
  {:else}
    <p></p>
  {/if}
  <CnToggle
    label="Frozen"
    disabled={adminStatus()}
    checked={frozenStatus() ?? false}
    onchange={toggleFrozen}
  />

