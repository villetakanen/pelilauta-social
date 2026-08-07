<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
import { getProfileAtom, loading } from '../../../stores/profiles';

interface Props {
  uid: string;
}
const { uid }: Props = $props();

const profileAtom = getProfileAtom(uid);
const profile = $derived($profileAtom);
const isLoading = $derived($loading.includes(uid));
</script>

{#if isLoading}
  <CnLoader inline noun="avatar" />
{:else if profile}
  <a href="/profiles/{profile.key}" aria-label="{profile.nick}">
    <cn-avatar
      src={profile.avatarURL} 
      nick={profile.nick}
      elevation="1"
      size="small"></cn-avatar>
  </a>
{:else}
  <cn-avatar
    nick="A0"
    elevation="1"
    size="small"></cn-avatar>
{/if}