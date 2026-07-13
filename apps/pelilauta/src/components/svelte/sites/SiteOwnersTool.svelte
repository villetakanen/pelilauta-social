<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
import { site, update } from '../../../stores/site';
import ProfileLink from '../app/ProfileLink.svelte';
import UserSelect from '../app/UserSelect.svelte';

let selectedUid = $state('-');

async function dropOwner(ownerUid: string) {
  if (!$site || !$site.owners.includes(ownerUid)) {
    return;
  }
  const newOwners = $site.owners.filter((id) => id !== ownerUid);
  await update({ owners: newOwners });
}

async function addOwner(event: Event) {
  event.preventDefault();
  if (!$site || $site.owners.includes(selectedUid)) {
    return;
  }
  if (selectedUid === '-') {
    return;
  }
  const newOwners = [...$site.owners, selectedUid];
  await update({ owners: newOwners });
}

function setSelectedUid(e: Event) {
  selectedUid = (e.target as HTMLSelectElement).value;
}
</script>

{#if $site }
<div>
  <h2>{t('site:owners.title')}</h2>
  <p class="downscaled">{t('site:owners.description')}</p>
  
  {#each $site.owners as owner}
  <div class="toolbar">
    <ProfileLink uid={owner} />
    <button
      aria-label={t('actions:remove')}
      type="button"
      disabled={$uid === owner}
      onclick={() => dropOwner(owner)}>
      <cn-icon noun="delete"></cn-icon>
    </button>
  </div>
{/each}

<hr>

<form onsubmit={addOwner} class="toolbar">
  <UserSelect
    omit={$site.owners}
    label={t('site:owners.add')}
    value={selectedUid}
    onchange={setSelectedUid}
  />
  <button type="submit" class="no-shrink"
    disabled={$site.owners.includes(selectedUid) || selectedUid === '-'}
  >{t('actions:add')}</button>
</form>
</div>
{/if}
