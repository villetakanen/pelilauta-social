<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
  pageKey: string;
}

const { site, pageKey }: Props = $props();

const visible = $derived.by(() => {
  if (site.owners.includes($uid)) return true;
  if (site.players?.includes($uid)) return true;
  return false;
});
</script>

{#if visible}
  <a
    href={`/sites/${site.key}/create/page`}
    class="fab button small"
    aria-label={t('actions:create.page')}
  >
    <Icon noun="add" size="small" />
    <span class="sm-hidden">{t('actions:create.page')}</span>
  </a>
  <a
    href={`/sites/${site.key}/${pageKey}/edit`}
    class="fab button"
    aria-label={t('actions:edit')}
  >
    <Icon noun="edit" size="small" />
    <span class="sm-hidden">{t('actions:edit')}</span>
  </a>
{/if}