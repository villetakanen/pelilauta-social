<script lang="ts">
import PreviewImport from './PreviewImport.svelte';
import UploadFilesForm from './UploadFilesForm.svelte';

// The site store is now initialized by the SiteStoreInitializer component
// on the page level. This component's children will react to the store.
</script>
<div class="content-columns">
  <UploadFilesForm />
  <PreviewImport />
</div>
