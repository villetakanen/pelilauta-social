<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { t } from 'src/utils/i18n';
import { uid } from '../../../../stores/session';
</script>
{#if $uid}
<a class="fab button" href="/create/character">
  <Icon noun="add" size="small" />
    <span class="sm-hidden">{t('actions:create.character')}</span>
  </a>
{/if}