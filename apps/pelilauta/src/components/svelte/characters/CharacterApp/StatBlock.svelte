<script lang="ts">
import { sheet } from '@stores/characters/characterStore';
import { t } from '@utils/i18n';
import { logDebug } from '@utils/logHelpers';
import Stat from './Stat.svelte';

interface Props {
  group: { key: string; layout: string };
}

const { group }: Props = $props();

const statsInGroup = $derived.by(() => {
  if (!$sheet?.stats) return [];
  return $sheet.stats.filter((stat) => stat.group === group.key);
});
</script>

<cn-stat-block 
  label={group.key}
  layout={group.layout}
>
    {#each statsInGroup as stat}
      <Stat {stat} />
    {/each}
</cn-stat-block>
