<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { systemToNounMapping } from 'src/schemas/nouns';
import { t } from 'src/utils/i18n';

interface Props {
  system?: string;
  setSystem: (system: string) => void;
}
const { system, setSystem }: Props = $props();

const noun = $derived.by(() => {
  return systemToNounMapping[system || 'homebrew'];
});
</script>

<div class="system-select">
  <label>
    {t('entries:site.system')}
    <select
      value={system}
      onchange={(event: Event) => setSystem((event.target as HTMLSelectElement).value)}
    >
      {#each Object.keys(systemToNounMapping) as sys}
        <option value={sys}>{t(`meta:systems.${sys}`)}</option>
      {/each}
    </select>
  </label>
  <CnIcon {noun} />
</div>

<style>
  .system-select {
    display: flex;
    align-items: flex-end;
    gap: var(--cn-gap);
  }

  label {
    flex: 1;
    min-inline-size: 0;
  }
</style>