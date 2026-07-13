<script lang="ts">
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

<input
  type="file"
  onchange={handleFileChange}
  style="display: none"
  bind:this={fileInputRef}
  {accept}
  {multiple}
  {disabled}
  data-testid="file-input"
/>
<button onclick={handleButtonClick} type="button" {disabled}>
  <cn-icon noun="assets"></cn-icon>
  <span>{t("actions:upload")}</span>
</button>
