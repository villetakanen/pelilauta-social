<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>
{#if $uid}
<a class="button fab" href="/create/site">
  <cn-icon noun="add" small ></cn-icon>
    <span class="sm-hidden">{t('actions:create.site')}</span>
  </a>
{/if}