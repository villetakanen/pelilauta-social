<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';

interface Props {
  site: Site;
}
const { site }: Props = $props();
let loading = $state(false);
const visible = $derived.by(() => site.owners.includes($uid));

/**
 * Regenerates page references for a site.
 */
async function regenPageRefs() {
  loading = true;
  try {
    // Dynamically import the utility function
    const { regenerateSiteToc } = await import(
      'src/firebase/client/site/regenerateSiteToc'
    );
    const pageCount = await regenerateSiteToc(site.key);

    // Handle UI feedback in the component
    pushSnack(t('site:toc.recreated', { count: pageCount }));
  } catch (error) {
    pushSnack(t('site:toc.regenerate.error'));
    console.error('Error regenerating TOC:', error);
  } finally {
    loading = false;
  }
}
</script>
{#if visible}
  <section class="border p-2 mt-2">
    <h2>{t('site:toc.regenerate.title')}</h2>
    <p>{t('site:toc.regenerate.info')}</p>
    <div class="flex justify-center">
      <button type="button" class="button" onclick={regenPageRefs}>
        <Icon noun="tools" />
        <span>{t('site:toc.regenerate.action')}</span>
      </button>
    </div>
  </section>
{/if}