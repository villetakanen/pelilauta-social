<script lang="ts">
/**
 * CnShareAction — a command that passes the page on. It shares through the
 * browser where it can, and leaves the URL on the clipboard where it cannot.
 * It shows nothing either way: the outcome travels as `cn-share`, and a
 * consumer decides whether the reader is told.
 */
import Icon from './Icon.svelte';

let {
  label,
  url,
  title,
  text,
}: {
  label: string;
  url?: string;
  title?: string;
  text?: string;
} = $props();

let button: HTMLButtonElement;

function report(outcome: 'shared' | 'copied' | 'failed') {
  // Svelte delegates onclick, so the event's currentTarget is not this button.
  button.dispatchEvent(
    new CustomEvent('cn-share', { bubbles: true, detail: { outcome } }),
  );
}

async function share() {
  const data: ShareData = {
    url: url ?? window.location.href,
    title: title ?? document.title,
  };
  // An unstated description is not shared, rather than shared as empty.
  if (text) data.text = text;

  if (navigator.share) {
    try {
      await navigator.share(data);
      report('shared');
    } catch (error) {
      // The reader closing the sheet is not a failure, and is the one
      // outcome that reports nothing.
      if ((error as Error)?.name !== 'AbortError') report('failed');
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(data.url as string);
    report('copied');
  } catch {
    report('failed');
  }
}
</script>

<button
  bind:this={button}
  type="button"
  class="chrome-action cn-share-action"
  onclick={share}
>
  <Icon noun="share" decorative />
  <span>{label}</span>
</button>
