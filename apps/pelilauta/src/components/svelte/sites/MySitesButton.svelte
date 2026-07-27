<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import { t } from 'src/utils/i18n';
import { uid } from '../../../stores/session';
</script>

{#if $uid}
  <a href="/library" class="button">
    <Icon noun="adventurer" size="small" />
    <span class="sm-hidden">{t('library:sites.title')}</span>
  </a>
{/if}