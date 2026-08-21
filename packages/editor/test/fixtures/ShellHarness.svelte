<script lang="ts">
/**
 * A `.ts` test cannot author a `{#snippet}` inline, so this fixture holds the
 * one the shell tests pass as `frontmatter`: a native title field, the
 * simplest slotted control that exercises `readFields`. `markClean` is
 * re-exported rather than reached through, because the shell's export is the
 * only door onto it — a test holding this component's instance has the same
 * access a consumer route would.
 */
import CnEditorShell from '../../CnEditorShell.svelte';

interface Props {
  value?: string;
  onDirtyChange?: (dirty: boolean) => void;
  /** False reproduces a consumer that slots no fields — scenario 6. */
  withFrontmatter?: boolean;
}

let {
  value = $bindable(''),
  onDirtyChange,
  withFrontmatter = true,
}: Props = $props();

let shell: ReturnType<typeof CnEditorShell> | undefined;

export function markClean(): void {
  shell?.markClean();
}

export function isDirty(): boolean {
  return shell?.isDirty() ?? false;
}

export function requestBack(): void {
  shell?.requestBack();
}
</script>

{#snippet frontmatter()}
  <input type="text" name="title" />
{/snippet}

<!--
  `dark` is stated rather than left to resolve: jsdom's `getComputedStyle`
  cannot serialize `color-scheme`, which is what an unstated `dark` reads.
  `CnEditor.test.ts` states it for the same reason.
-->
<CnEditorShell
  bind:this={shell}
  bind:value
  frontmatter={withFrontmatter ? frontmatter : undefined}
  {onDirtyChange}
  dark={false}
/>
