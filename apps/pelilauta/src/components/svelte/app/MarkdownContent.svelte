<script lang="ts">
import '@dice/styles/dice.css';
import { renderMarkdown } from 'src/utils/shared/renderMarkdown';

interface Props {
  content: string;
  /** The site origin; defaults to the browser's when rendered client-side. */
  origin?: string;
}
const { content, origin = window.location.origin }: Props = $props();
</script>

<div class="content-area">
  {@html renderMarkdown(content, { origin, namespace: 'preview-reply' })}
</div>
