<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { t } from 'src/utils/i18n';
import { showAdminTools } from '../../../stores/session';
</script>

{#if $showAdminTools}
  <a class="chrome-action" href="/admin">
    <Icon noun="admin" decorative />
    <span>{t('navigation:admin')}</span>
  </a>
{/if}
