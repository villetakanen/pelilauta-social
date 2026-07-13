<script lang="ts">
import type { Site } from 'src/schemas/SiteSchema';
import { t } from 'src/utils/i18n';
import type { Snippet } from 'svelte';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';

interface Props {
  site: Site;
  children?: Snippet;
}

const { site, children }: Props = $props();

const visible = $derived.by(() => {
  if (site.owners.includes($uid)) return true;
  if (site.players?.includes($uid)) return true;
  return false;
});
</script>

<WithAuth
  allow={visible}
  message={t('app:forbidden.membersOnly')}>
  {@render children?.()}
</WithAuth>
  