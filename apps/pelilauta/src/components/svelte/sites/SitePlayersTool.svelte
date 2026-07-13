<script lang="ts">
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

function setUsePlayers(e: Event) {
  usePlayers = (e.target as CyanToggleButton).pressed;
  update({ usePlayers });
}
</script>

<div>
  <h2>{t('site:players.title')}</h2>
  <p class="downscaled">{t('site:players.description')}</p>

  <cn-toggle-button
    label={t('site:players.usePlayers')}
    pressed={usePlayers}
    onchange={setUsePlayers}
  ></cn-toggle-button>

{#if $site && $site.usePlayers}
{#if $site.players?.length}

{#each listedPlayers as player}
  <div class="toolbar">
    <ProfileLink uid={player} />
    <button
      aria-label={t('actions:remove')}
      type="button"
      disabled={$uid === player}
      onclick={() => dropPlayer(player)}>
      <cn-icon noun="delete"></cn-icon>
    </button>
  </div>
{/each}

<hr>
{/if}

<form onsubmit={addPlayer} class="toolbar">
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
</div>