<script lang="ts">
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
    <cn-icon noun="add" small></cn-icon>
    <span class="sm-hidden">{t('actions:create.page')}</span>
  </a>
  <a
    href={`/sites/${site.key}/${pageKey}/edit`}
    class="fab button"
    aria-label={t('actions:edit')}
  >
    <cn-icon noun="edit" small></cn-icon>
    <span class="sm-hidden">{t('actions:edit')}</span>
  </a>
{/if}