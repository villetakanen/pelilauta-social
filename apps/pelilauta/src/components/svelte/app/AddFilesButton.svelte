<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';
import { t } from 'src/utils/i18n';

interface Props {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  addFiles: (files: File[]) => void;
}

const {
  accept = 'image/*',
  multiple = true,
  disabled = false,
  addFiles,
}: Props = $props();

let fileInputRef: HTMLInputElement;

function handleFileChange(event: Event) {
  const { files } = event.target as HTMLInputElement;
  if (files) {
    addFiles(Array.from(files));
  }
}
const handleButtonClick = () => {
  fileInputRef?.click();
};
</script>

<!--
  The name matters beyond the form: the editor shell's dirty diff records
  every named control in its region, and an anonymous one collides with any
  other anonymous control that later joins it.
-->
<input
  type="file"
  name="files"
  onchange={handleFileChange}
  style="display: none"
  bind:this={fileInputRef}
  {accept}
  {multiple}
  {disabled}
  data-testid="file-input"
/>
<button onclick={handleButtonClick} type="button" {disabled}>
  <CnIcon noun="assets" />
  <span>{t("actions:upload")}</span>
</button>
