<script lang="ts">
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';
</script>
{#if $uid}
<a class="fab button" href="/create/character">
  <cn-icon noun="add" small ></cn-icon>
    <span class="sm-hidden">{t('actions:create.character')}</span>
  </a>
{/if}