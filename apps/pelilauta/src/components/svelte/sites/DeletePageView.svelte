<script lang="ts">
import type { Page } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
import WithAuth from '../app/WithAuth.svelte';

interface Props {
  site: Site;
  page: Page;
}
const { site, page }: Props = $props();

const allow = $derived.by(() => site.owners.includes($uid));

/**
 * Handles the form submission to delete a page
 * @param event The form submit event
 */
async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();

  // Dynamically import the delete function
  const { deletePage } = await import('src/firebase/client/site/deletePage');
  await deletePage(site.key, page.key);

  // Show success notification
  pushSessionSnack(t('snack:site.pageDeleted', { name: page.name }));

  // Redirect to site home
  window.location.href = `/sites/${site.key}`;
}
</script>
  
<WithAuth {allow}>
  <section class="surface">
    <p>{t('site:deletePage.info', { name: page.name })}</p>
    <form onsubmit={handleSubmit} class="text-end">
      <button type="button" class="text" onclick={() => window.history.back()}>
        {t('actions:cancel')}
      </button>
      <button type="submit">
        {t('actions:delete')}
      </button>
    </form>
  </section>
</WithAuth>

<style>
  /*
   * The container reaches this box but not into it, so the interval between the
   * message and the action row is stated here.
   */
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>