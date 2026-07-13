<script lang="ts">
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
  <cn-loader inline></cn-loader>
{:else if site}
  <a href="/sites/{site.key}">{site.name}</a>
{:else}
  <a href="/sites/{siteKey}">{t('sites:meta.siteNotFoundName')}</a>
{/if}