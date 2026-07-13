<script lang="ts">
import { updateSiteApi } from 'src/firebase/client/site/updateSiteApi';
import {
  type Site,
  type SiteSortOrder,
  SiteSortOrderSchema,
} from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { authUser, uid } from '../../../../stores/session';
import WithAuth from '../../app/WithAuth.svelte';
import ManualTocOrdering from './ManualTocOrdering.svelte';
import SiteCategoriesTool from './SiteCategoriesTool.svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();

// Local state for the site to allow optimistic updates
let localSite = $state(site);
const sortOrder = $state(localSite.sortOrder);
//let chapters:CategoryRef[] = $state(site.pageCategories || []);

const sortOrderOptions = new Map<string, string>([
  ['name' as SiteSortOrder, t('entries:site.sortOrders.name')],
  ['createdAt' as SiteSortOrder, t('entries:site.sortOrders.createdAt')],
  ['flowTime' as SiteSortOrder, t('entries:site.sortOrders.flowTime')],
  ['manual' as SiteSortOrder, t('entries:site.sortOrders.manual')],
]);

async function setSortOrder(e: Event) {
  const target = e.target as HTMLSelectElement;
  const value = target.value as SiteSortOrder;
  try {
    await updateSiteApi(
      {
        key: localSite.key,
        sortOrder: value,
      },
      true,
    );

    // Update local state
    localSite.sortOrder = value;

    // Update global store
    const { updateSite } = await import('../../../../stores/sites/sitesStore');
    updateSite(localSite.key, { sortOrder: value });
    // Lets notiufy the user about the update
    pushSnack(t('snack:site.sortOrderUpdated'));
  } catch (error) {
    logError('SiteTocTool', 'Failed to update sort order:', error);
    pushSnack(t('snack:site.sortOrderUpdateFailed'));
  }
}
</script>

<WithAuth allow={localSite.owners.includes($uid)}>
  <div class="content-columns">
    <section>
      <h2>
        <cn-icon noun="tools"></cn-icon>
        {t("site:toc.admin.title")}
      </h2>
      <p>{t("site:toc.admin.info")}</p>
      <label>
        <span>{t("entries:site.sortOrder")}</span>
        <select name="sortOrder" onchange={setSortOrder} disabled={!$authUser}>
          {#each Array.from(sortOrderOptions.entries()) as [value, label]}
            <option selected={sortOrder === value} {value}>{label} </option>
          {/each}
        </select>
      </label>
    </section>
    {#if localSite.sortOrder === "manual"}
      <ManualTocOrdering site={localSite} />
    {/if}
    <SiteCategoriesTool site={localSite} />
  </div>
</WithAuth>
