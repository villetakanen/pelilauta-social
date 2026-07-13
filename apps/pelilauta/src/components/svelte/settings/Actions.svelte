<script lang="ts">
import { t } from 'src/utils/i18n';
import { logout } from '../../../stores/session';

async function logoutAction() {
  await logout();
  window.location.href = '/';
}
</script>

<article class="actions">
  <h3>{t('settings:actions.title')}</h3>
  <button class="button" type="button" onclick={logoutAction}>
    {t('actions:logout')}
  </button>
</article>