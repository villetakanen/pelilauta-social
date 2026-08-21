<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from 'src/utils/i18n';
import { showAdminTools } from '../../../stores/session';
</script>

{#if $showAdminTools}
  <a class="chrome-action" href="/admin">
    <CnIcon noun="admin" decorative />
    <span>{t('admin:app.title')}</span>
  </a>
{/if}
