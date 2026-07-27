<script lang="ts">
import Icon from '@design-system/components/Icon.svelte';
import type { Site } from 'src/schemas/SiteSchema';
import { uid } from '../../../stores/session';

interface Props {
  site: Site;
}

const { site } = $props() as Props;
const owns = $derived(site.owners.includes($uid));
</script>
{#if owns}
<Icon noun="avatar" size="small" />
{/if}