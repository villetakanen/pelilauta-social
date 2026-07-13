<script lang="ts">
import {
  activeProfiles,
  fetchActiveProfiles,
} from 'src/stores/activeProfilesStore';
import { t } from 'src/utils/i18n';
import { onMount } from 'svelte';
import { uid } from '../../../stores/session';

interface Props {
  value: string;
  label?: string;
  omit?: string[];
  onchange: (e: Event) => void;
}

const { value, onchange, label, omit }: Props = $props();

/**
 * A Wrapper for <select> that provides a list of (active) users to select from.
 */
onMount(() => {
  console.log('UserSelect mounted');
  fetchActiveProfiles();
});

const profiles = $derived.by(() => {
  return [...$activeProfiles].sort((a, b) => a.nick.localeCompare(b.nick));
});
</script>
<label style="width: 100%;">
  {label ?? t('actions:select.user')}
  <select
    style="width: 100%"
  {value}
  {onchange}
>
  <option value="-" selected> – </option>
{#each profiles as profile}
  {#if profile.key !== $uid && (!omit || !omit.includes(profile.key))}
    <option value={profile.key}>{profile.nick}</option>
  {/if}
{/each}
</label>