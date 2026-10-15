<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { isResolvedActive } from 'src/stores/session/computed';
import { t } from 'src/utils/i18n';
</script>
{#if $isResolvedActive}
  <a class="fab" href="/create/site">
    <CnIcon noun="add" />
    <span>{t('actions:create.site')}</span>
  </a>
{/if}