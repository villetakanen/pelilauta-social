<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>
{#if $uid}
  <a class="fab" href="/create/site">
    <CnIcon noun="add" />
    <span>{t('actions:create.site')}</span>
  </a>
{/if}