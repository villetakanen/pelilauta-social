<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { isResolvedActive } from 'src/stores/session/computed';
import { t } from 'src/utils/i18n';
</script>

{#if $isResolvedActive}
  <a href="/library" class="button">
    <CnIcon noun="adventurer" size="small" />
    <span class="sm-hidden">{t('library:sites.title')}</span>
  </a>
{/if}