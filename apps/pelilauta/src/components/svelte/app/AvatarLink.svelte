<script lang="ts">
import CnAvatar from '@design-system/components/CnAvatar.svelte';
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
  <a href="/profiles/{profile.key}" aria-label={profile.nick}>
    <CnAvatar src={profile.avatarURL} nick={profile.nick} size="small" aria-hidden />
  </a>
{:else}
  <CnAvatar size="small" />
{/if}
