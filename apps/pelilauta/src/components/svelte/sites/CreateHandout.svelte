<script lang="ts">
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

interface Props {
  site: Site;
}
const { site }: Props = $props();

async function handleSubmit(event: Event) {
  event.preventDefault();

  // get form data { title }
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const title = formData.get('title') as string;

  try {
    const { getFirestore, addDoc, collection } = await import(
      'firebase/firestore'
    );
    const handout = handoutFrom({ title, owners: [$uid] }, '');
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
  }
}
</script>
<div class="content-columns">
  <article>
    <h1>{t('site:handouts.create.title')}</h1>
    <form onsubmit={handleSubmit}>
      <label>{t('entries:handout.title')}
        <input 
          name="title"
        type="text" placeholder={t('site:handouts.create.title')} />
      </label>
      <div class="toolbar">
        <a href="/sites/{site.key}/handouts" class="text button">{t('actions:cancel')}</a>
        <button type="submit">{t('actions:create.handout')}</button>
      </div>
    </form>
  </article>
</div>