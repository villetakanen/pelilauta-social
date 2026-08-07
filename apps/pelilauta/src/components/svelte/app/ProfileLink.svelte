<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
import { t } from 'src/utils/i18n';
import { logWarn } from 'src/utils/logHelpers';
import { getProfileAtom, loading } from '../../../stores/profiles';

interface Props {
  uid?: string;
}
const { uid }: Props = $props();

// Defensive check for undefined uid
if (!uid) {
  logWarn('ProfileLink: received undefined uid, rendering anonymous');
}

const profileAtom = uid ? getProfileAtom(uid) : undefined;

const profile = $derived.by(() => {
  return profileAtom ? $profileAtom : undefined;
});

const isLoading = $derived.by(() => {
  return uid ? $loading.includes(uid) : false;
});
</script>

{#if isLoading}
  <CnLoader inline />
{:else if profile}
  <a class="cn-nick" href="/profiles/{profile.key}">{profile.nick}</a>
{:else}
  <span>{t("app.anonymous.nick")}</span>
{/if}
