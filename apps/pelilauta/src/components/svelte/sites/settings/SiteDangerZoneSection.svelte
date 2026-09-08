<script lang="ts">
import { deleteSite } from 'src/firebase/client/site/deleteSite';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';

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
  // The site store sets itself to null once the document is gone, and this
  // prop follows it; the snack needs the name from before the delete.
  const { name } = site;
  try {
    await deleteSite(site);
    pushSessionSnack('site:snacks.siteDeleted', { name });
    window.location.href = '/library';
  } catch (error) {
    logError('SiteDangerZoneSection', error);
    pushSnack('site:snacks.errorDeletingSite');
  }
}
</script>

<details class="surface">
  <summary>{t('app:meta.dangerZone')}</summary>

  <section class="surface has-alert">
    <h3>{t('site:dangerZone.title')}</h3>
    <p>{t('site:dangerZone.description')}</p>
    <form onsubmit={onSubmit}>
      <label>
        <input
          type="text"
          name="deleteConfirm"
          placeholder={deleteConfirmPhrase}
          oninput={(e: Event) => {
            setDeleteConfirm((e.target as HTMLInputElement).value);
          }}
        />
      </label>
      <div class="text-end">
        <button
          class="cta"
          type="submit"
          disabled={deleteConfirm !== deleteConfirmPhrase}
        >
          {t('site:dangerZone.deleteSiteAction')}
        </button>
      </div>
    </form>
  </section>
</details>

<style>
  summary {
    cursor: pointer;
  }

  details,
  section,
  form {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
