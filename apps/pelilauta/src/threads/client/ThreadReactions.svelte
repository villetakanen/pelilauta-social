<script lang="ts">
import ReactionButton from '@svelte/app/ReactionButton.svelte';
import { isResolvedActive } from 'src/stores/session/computed';

interface Props {
  key: string;
  title: string;
}
const { key, title }: Props = $props();
</script>

{#if $isResolvedActive}
  <ReactionButton target="thread" {key} {title} />
{/if}
