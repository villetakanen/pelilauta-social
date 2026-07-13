<script lang="ts">
import type { Page } from 'src/schemas/PageSchema';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
  page: Page;
}
const { site, page }: Props = $props();

// Check if current user is a site owner
const visible = $derived.by(() => site.owners.includes($uid));

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
  pushSessionSnack(t('snacks.pageDeleted', { name: page.name }));

  // Redirect to site home
  window.location.href = `/sites/${site.key}`;
}
</script>
  
  {#if visible}
    <div class="content-columns">
      <div>
        <h1 class="downscaled">{t('actions:confirm.delete')}</h1>
        <p>{t('site:deletePage.info', { name: page.name })}</p>
        <form onsubmit={handleSubmit}>
          <div class="toolbar justify-end">
            <button 
              type="button" 
              class="text" 
              onclick={() => window.history.back()}
            >
              {t('actions:cancel')}
            </button>
            <button type="submit">
              {t('actions:delete')}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}