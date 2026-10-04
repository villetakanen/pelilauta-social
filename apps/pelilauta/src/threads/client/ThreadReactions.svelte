<script lang="ts">
import ReactionButton from '@svelte/app/ReactionButton.svelte';
import { isResolvedActive } from 'src/stores/session/computed';

interface Props {
  key: string;
  title: string;
}
const { key, title }: Props = $props();
</script>

<!-- ReactionButton reads its reaction document on mount, so mount it only once Firebase confirms an active session. -->
{#if $isResolvedActive}
  <ReactionButton target="thread" {key} {title} />
{/if}
