<script lang="ts">
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
  <cn-loader icon="avatar"></cn-loader>
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