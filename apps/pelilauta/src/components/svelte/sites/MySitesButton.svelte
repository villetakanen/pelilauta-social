<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>

{#if $uid}
  <a href="/library" class="button">
    <CnIcon noun="adventurer" size="small" />
    <span class="sm-hidden">{t('library:sites.title')}</span>
  </a>
{/if}