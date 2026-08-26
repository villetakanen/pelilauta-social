<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';

interface Props {
  site: Site;
}

const { site }: Props = $props();

const visible = $derived.by(() => {
  if (site.owners.includes($uid)) return true;
  return false;
});
</script>
    
{#if visible}
  <a href={`/sites/${site.key}/create/handout`} class="fab">
    <CnIcon noun="add" />
    <span>{t('actions:create.handout')}</span>
  </a>
{/if}