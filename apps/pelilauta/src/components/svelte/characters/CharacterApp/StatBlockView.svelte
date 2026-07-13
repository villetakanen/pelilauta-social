<script lang="ts">
import { character, sheet } from '@stores/characters/characterStore';
import NumberStat from './NumberStat.svelte';

interface Props {
  group: { key: string; layout: string };
}

const { group }: Props = $props();

const statsInGroup = $derived.by(() => {
  if (!$sheet?.stats) return [];
  return $sheet.stats.filter((stat) => stat.group === group.key);
});

const type = (key: string) => {
  return $sheet?.stats?.find((s) => s.key === key)?.type || 'number';
};
</script>

<cn-stat-block label={group.key} layout={group.layout}>
  {#each statsInGroup as stat}
    {#if stat.type === 'number'}
      <NumberStat key={stat.key} />
    {:else if stat.type === 'd20_ability_score'}
      <cn-d20-ability-score
        class="stat"
        label={stat.key}
        readonly
        base={$character?.stats[stat.key] || 10}
      ></cn-d20-ability-score>
    {:else if stat.type === 'toggled'}
      <div class="flex items-center">
        <h4 class="text-h5 m-0 grow" style="flex-grow:1">
          {stat.key}
        </h4>
        <div>
          <input type="checkbox" checked={stat.value === true} readonly />
        </div>
      </div>
    {/if}
  {/each}

  <div class="grow"></div>
</cn-stat-block>