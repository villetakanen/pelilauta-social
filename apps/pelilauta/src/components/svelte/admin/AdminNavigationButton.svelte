<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { t } from 'src/utils/i18n';
import { showAdminTools } from '../../../stores/session';

let { ariaCurrent }: { ariaCurrent?: string } = $props();
</script>

{#if $showAdminTools}
  <a class="chrome-action" href="/admin" aria-current={ariaCurrent}>
    <Icon noun="admin" decorative />
    <span>{t('navigation:admin')}</span>
  </a>
{/if}
