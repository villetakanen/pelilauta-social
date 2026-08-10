<script lang="ts">
import CnAvatar from '@design-system/components/CnAvatar.svelte';
import CnLoader from '@design-system/components/CnLoader.svelte';
import { getProfileAtom, loading } from '../../../stores/profiles';

interface Props {
  uid: string;
  /** Small by default: most links sit beside a single line of text. */
  size?: 'small' | 'medium' | 'large';
}
const { uid, size = 'small' }: Props = $props();

const profileAtom = getProfileAtom(uid);
const profile = $derived($profileAtom);
const isLoading = $derived($loading.includes(uid));
</script>

{#if isLoading}
  <CnLoader inline noun="avatar" />
{:else if profile}
  <a href="/profiles/{profile.key}" aria-label={profile.nick}>
    <CnAvatar src={profile.avatarURL} nick={profile.nick} {size} aria-hidden />
  </a>
{:else}
  <CnAvatar {size} />
{/if}
