<script lang="ts">
import { marked } from 'marked';

interface Props {
  content: string;
}
const { content }: Props = $props();
</script>

<div class="content-area">
  {@html marked.parse(content)}
</div>
