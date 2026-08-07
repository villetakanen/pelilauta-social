<script lang="ts">
import CnLoader from '@design-system/components/CnLoader.svelte';
import { getSite, loading } from 'src/stores/sites/sitesStore';
import { t } from 'src/utils/i18n';

interface Props {
  siteKey: string;
}
const { siteKey }: Props = $props();

const siteAtom = getSite(siteKey);
const site = $derived($siteAtom);
const isLoading = $derived($loading.includes(siteKey));
</script>

{#if isLoading && !site}
  <CnLoader inline />
{:else if site}
  <a href="/sites/{site.key}">{site.name}</a>
{:else}
  <a href="/sites/{siteKey}">{t('sites:meta.siteNotFoundName')}</a>
{/if}