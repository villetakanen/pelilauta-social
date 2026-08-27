<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import CnToggle from '@design-system/components/CnToggle.svelte';
import { addNotification } from 'src/firebase/client/notifications';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
import { site, update } from '../../../stores/site';
import ProfileLink from '../app/ProfileLink.svelte';
import UserSelect from '../app/UserSelect.svelte';

let selectedUid = $state('-');
let usePlayers = $state($site?.usePlayers ?? false);
const listedPlayers = $derived.by(() => {
  // Return all players, who are not in the owners list
  return (
    $site?.players?.filter((player) => !$site.owners?.includes(player)) ?? []
  );
});

function addPlayer(event: Event) {
  event.preventDefault();
  if (
    !$site ||
    !selectedUid ||
    selectedUid === '-' ||
    $site.players?.includes(selectedUid)
  ) {
    return;
  }
  const newPlayers = $site.players
    ? [...$site.players, selectedUid]
    : [selectedUid];

  addNotification({
    key: `${$site.key}-${selectedUid}`,
    targetType: 'site.invited',
    createdAt: new Date(),
    targetKey: $site.key,
    to: selectedUid,
    from: $uid,
    targetTitle: $site.name,
    read: false,
  });

  update({ players: newPlayers });
}

function dropPlayer(playerUid: string) {
  if (!$site || !playerUid) {
    return;
  }
  const newPlayers = $site.players?.filter((id) => id !== playerUid) ?? [];
  update({ players: newPlayers });
}

function setSelectedUid(e: Event) {
  selectedUid = (e.target as HTMLSelectElement).value;
}

function setUsePlayers(e: Event & { currentTarget: HTMLInputElement }) {
  usePlayers = e.currentTarget.checked;
  update({ usePlayers });
}
</script>

<section class="surface">
  <h2>{t('site:players.title')}</h2>
  <p>{t('site:players.description')}</p>

  <CnToggle
    label={t('site:players.usePlayers')}
    checked={usePlayers}
    onchange={setUsePlayers}
  />

{#if $site && $site.usePlayers}
{#if $site.players?.length}

{#each listedPlayers as player}
  <div class="member-row">
    <ProfileLink uid={player} />
    <button
      aria-label={t('actions:remove')}
      type="button"
      class="button text"
      disabled={$uid === player}
      onclick={() => dropPlayer(player)}>
      <CnIcon noun="delete" />
    </button>
  </div>
{/each}

<hr>
{/if}

<form onsubmit={addPlayer} class="add-form">
  <UserSelect
    omit={[...$site.owners, ...$site.players ?? []]}
    label={t('site:players.add')}
    value={selectedUid}
    onchange={setSelectedUid}
  />
  <button 
    disabled={$site.players?.includes(selectedUid) || selectedUid === '-'}
    type="submit">{t('actions:add')}</button>
</form>

{/if}
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }

  .member-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--cn-gap);
  }

  .add-form {
    display: flex;
    align-items: flex-end;
    gap: var(--cn-gap);
  }
</style>