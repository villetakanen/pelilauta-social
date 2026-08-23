<script lang="ts">
/**
 * CnSeparator — an ornamental break between two unrelated sections: a hairline, an
 * icon, a hairline. Unlike `<hr>` it carries no thematic meaning, so it renders no
 * accessible role or name. `specs/design-system/dividers/spec.md` governs both marks.
 */
import CnIcon from './CnIcon.svelte';

let { noun = 'fox' }: { noun?: string } = $props();
</script>

<div class="cn-separator">
  <span class="line"></span>
  <CnIcon {noun} size="large" decorative />
  <span class="line"></span>
</div>

<style>
  .cn-separator {
    display: flex;
    align-items: center;
    gap: var(--cn-gap);
  }

  .line {
    flex: 1 1 auto;
    block-size: 0;
    border-block-start: 1px solid var(--cn-color-border);
  }
</style>
