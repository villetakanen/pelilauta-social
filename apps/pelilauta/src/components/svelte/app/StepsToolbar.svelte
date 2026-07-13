<script lang="ts">
interface Props {
  steps: string[];
  progress: number; // 0 to steps.length-1
  onStepClick?: (stepIndex: number) => void;
}
const { steps, progress, onStepClick }: Props = $props();
</script>

<div class="toolbar">
  {#each steps as step, index}
    <button class:text={index !== progress} disabled={index > progress} onclick={() => onStepClick?.(index)}>
      {step}
    </button>
  {/each}
</div>