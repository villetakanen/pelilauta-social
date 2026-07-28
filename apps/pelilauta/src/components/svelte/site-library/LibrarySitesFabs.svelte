<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>
{#if $uid}
<a class="button fab" href="/create/site">
  <Icon noun="add" size="small" />
    <span class="sm-hidden">{t('actions:create.site')}</span>
  </a>
{/if}