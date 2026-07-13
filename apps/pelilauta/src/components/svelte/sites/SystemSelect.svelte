<script lang="ts">
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

<div class="toolbar px-0">
  <label class="grow">
    {t('entries:site.system')}
    <select
      style="width:100%"
      value={system}
      onchange={(event:Event) => setSystem((event.target as HTMLSelectElement).value)}>
      
      {#each Object.keys(systemToNounMapping) as system}
        <option value={system}>{t(`meta:systems.${system}`)}</option>
      {/each}

    </select>
  </label>
  <cn-icon {noun}></cn-icon>
</div>



    <!--cn-icon noun={noun()} />
    <label class="grow">
      {t('entries:site.system')}
      <select
        value={props.system}
        onchange={(event) => props.setSystem(event.target.value)}
      >
        <For each={Object.keys(systemToNounMapping)}>
          {(system) => (
            <option value={system}>{t(`meta:systems.${system}`)}</option>
          )}
        </For>
      </select>
    </label>
  </div-->