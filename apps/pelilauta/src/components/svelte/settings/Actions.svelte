<script lang="ts">
import { t } from 'src/utils/i18n';
import { logout } from '../../../stores/session';

async function logoutAction() {
  await logout();
  window.location.href = '/';
}
</script>

<section class="surface">
  <h3>{t('settings:actions.title')}</h3>
  <div class="actions justify-end">
    <button class="button" type="button" onclick={logoutAction}>
      {t('actions:logout')}
    </button>
  </div>
</section>

<style>
  .surface {
    display: grid;
    row-gap: var(--cn-line);
  }
</style>
