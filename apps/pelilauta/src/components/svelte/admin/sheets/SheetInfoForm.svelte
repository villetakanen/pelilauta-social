<script lang="ts">
import {
  dirty,
  save,
  characterSheet as sheet,
} from 'src/stores/characters/characterSheetStore';
import { pushSnack } from 'src/utils/client/snackUtils';
import { t } from 'src/utils/i18n';
import SystemSelect from '../../sites/SystemSelect.svelte';

let name = $state('');
let system = $state('');

$effect(() => {
  // On update of the sheet, override the local state
  if ($sheet) {
    name = $sheet.name;
    system = $sheet.system;
  }
});

async function onsubmit(e: Event) {
  e.preventDefault();
  await save().catch((error) => {
    pushSnack({
      message: `Failed to save sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  });
  pushSnack({ message: 'Sheet saved' });
}
</script>

{#if $sheet}
  <form  {onsubmit}>
    <div class="toolbar">
    <label class="grow">
      <span class="label">{t('characters:sheets.fields.name')}</span>
      <input
        type="text"
        value="{name}"
        oninput={(e) => {
          name = (e.target as HTMLInputElement).value;
          const updated = { ...$sheet, name };
          sheet.set(updated);
        }}
        placeholder={t('characters:sheets.placeholders.name')}
        required />
    </label>

    
      
  <button type="submit" class="button primary" disabled={!$dirty}>
    <cn-icon noun="save"></cn-icon>
    <span>Save Sheet</span>
  </button>
  </div>

  <div class="toolbar mb-2">
    <SystemSelect {system} setSystem={(newSystem) => {
      system = newSystem;
      const updated = { ...$sheet, system };
      sheet.set(updated);
    }} />
  </div>

  </form>
{/if}



