<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import {
  HANDOUTS_COLLECTION_NAME,
  handoutFrom,
} from 'src/schemas/HandoutSchema';
import { SITES_COLLECTION_NAME, type Site } from 'src/schemas/SiteSchema';
import { pushSnack } from 'src/utils/client/snackUtils';
import { toFirestoreEntry } from 'src/utils/client/toFirestoreEntry';
import { t } from 'src/utils/i18n';
import { logError } from 'src/utils/logHelpers';
import { uid } from '../../../stores/session';
import MembersOnly from './MembersOnly.svelte';

interface Props {
  site: Site;
}
const { site }: Props = $props();

let title = $state('');
let saving = $state(false);

const canSubmit = $derived.by(() => {
  return title.trim().length > 0 && !saving;
});

async function handleSubmit(event: Event) {
  event.preventDefault();
  if (!$uid || !canSubmit) return;

  saving = true;

  try {
    const { getFirestore, addDoc, collection } = await import(
      'firebase/firestore'
    );
    const handout = handoutFrom({ title: title.trim(), owners: [$uid] }, '');
    const entry = toFirestoreEntry(handout);

    const { id } = await addDoc(
      collection(
        getFirestore(),
        SITES_COLLECTION_NAME,
        site.key,
        HANDOUTS_COLLECTION_NAME,
      ),
      entry,
    );

    window.location.href = `/sites/${site.key}/handouts/${id}`;
  } catch (error) {
    logError(error);
    pushSnack(t('errors:handout.create'));
  } finally {
    saving = false;
  }
}
</script>

<MembersOnly {site}>
  <section class="surface">
    <form onsubmit={handleSubmit}>
      <label>
        {t('entries:handout.title')}
        <input
          name="title"
          bind:value={title}
          type="text"
          placeholder={t('site:handouts.create.title')}
        />
      </label>
      <div class="actions justify-end">
        <a href="/sites/{site.key}/handouts" class="button text">
          {t('actions:cancel')}
        </a>
        <button type="submit" disabled={!canSubmit}>
          <CnIcon noun="add" />
          <span>{t('actions:create.handout')}</span>
        </button>
      </div>
    </form>
  </section>
</MembersOnly>

<style>
  /*
   * .surface publishes padding and containment only, so this box states
   * the interval between its own child blocks.
   */
  .surface,
  form {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>