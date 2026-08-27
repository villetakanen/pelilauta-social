<script lang="ts">
import { deleteSite } from 'src/firebase/client/site/deleteSite';
import type { Site } from 'src/schemas/SiteSchema';
import { pushSessionSnack, pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';

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

<details class="surface">
  <summary>{t('app:meta.dangerZone')}</summary>

  <section class="surface error">
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
