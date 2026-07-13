<script lang="ts">
import { deleteSite } from 'src/firebase/client/site/deleteSite';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import type { P } from 'vitest/dist/chunks/environment.LoooBwUu.js';

interface Props {
  site: Site;
}
const { site }: Props = $props();

const deleteConfirmPhrase = 'Olen Aivan Varma';
let deleteConfirm = $state('');

function setDeleteConfirm(value: string) {
  deleteConfirm = value;
}

async function onSubmit(e: Event) {
  e.preventDefault();

  if (deleteConfirm !== deleteConfirmPhrase) {
    return;
  }
  try {
    await deleteSite(site);
    pushSessionSnack('site:snacks.siteDeleted', { name: site.name });
    window.location.href = '/library';
  } catch (error) {
    pushSnack('site:snacks.errorDeletingSite');
  }
}
</script>

<cn-accordion 
    class="border radius-m"
    label={t('app:meta.dangerZone')} 
    noun="monsters">

    <section class="surface radius-m warning">
    <h3>{t('site:dangerZone.title')}</h3>
  <p class="italic">{t('site:dangerZone.description')}</p>
  <form onsubmit={onSubmit}>
    <input
      type="text"
      name="deleteConfirm"
      placeholder={deleteConfirmPhrase}
      oninput={(e: Event) => {
        setDeleteConfirm((e.target as HTMLInputElement).value);
      }}
    />
    <div class="toolbar justify-center">
      <button
        class="call-to-action notify"
        type="submit"
        disabled={deleteConfirm !== deleteConfirmPhrase}
      >
        {t('site:dangerZone.deleteSiteAction')}
      </button>
    </div>
  </form>
  </section>
</cn-accordion>
