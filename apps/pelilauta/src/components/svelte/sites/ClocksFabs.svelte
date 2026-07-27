<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

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
  <a
    href={`/sites/${site.key}/create/clock`}
    class="fab button"
  >
    <Icon noun="add" size="small" />
    <span class="sm-hidden">{t('actions:create.clock')}</span>
  </a>
{/if}