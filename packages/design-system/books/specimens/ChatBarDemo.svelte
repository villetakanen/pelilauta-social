<script lang="ts">
/**
 * ChatBarDemo — a consumer doing what the application does: it binds
 * `value`, receives `onsend`, and renders leading and trailing actions plus
 * supporting content. CnChatBar is controlled, so the readout of sent
 * messages and the draft are two different pieces of state — a send that
 * cleared the draft on its own would be the component acting on its own,
 * which is exactly what it must not do.
 *
 * Book: apps/design/src/content/components/cn-chat-bar.mdx
 */
import CnChatBar from '../../components/CnChatBar.svelte';
import Icon from '../../components/Icon.svelte';

let value = $state('');
let sent = $state<string[]>([]);
let attached = $state(false);

function onsend(draft: string) {
  sent = [...sent, draft];
}

const readout = $derived(
  sent.length === 0
    ? 'Ei lähetettyjä viestejä.'
    : `Lähetetty: ${sent[sent.length - 1]}`,
);
</script>

<div class="chat-bar-demo">
  <p class="text-label" aria-live="polite">{readout}</p>

  <div class="frame">
    <CnChatBar
      bind:value
      label="Vastaa keskusteluun"
      placeholder="Kirjoita viesti..."
      {onsend}
      menuLabel="Lisää"
    >
      {#if attached}
        {#snippet supporting()}
          <span class="attachment-chip">
            <Icon noun="assets" decorative />
            <span>kartta.png</span>
            <button
              type="button"
              aria-label="Poista liite"
              onclick={() => (attached = false)}
            >
              <Icon noun="delete" decorative />
            </button>
          </span>
        {/snippet}
      {/if}
      {#snippet menu()}
        <button type="button" onclick={() => (attached = true)}>
          <Icon noun="assets" decorative />
          <span>Lisää kuva</span>
        </button>
        <button type="button" onclick={() => (attached = false)}>
          <Icon noun="delete" decorative />
          <span>Poista liite</span>
        </button>
      {/snippet}
      {#snippet trailing()}
        <button type="button" class="chrome-action" aria-label="Lähetä" onclick={() => onsend(value)}>
          <Icon noun="send" decorative />
        </button>
      {/snippet}
    </CnChatBar>
  </div>
</div>

<style>
  .chat-bar-demo {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .chat-bar-demo p {
    margin: 0;
  }

  .frame {
    position: relative;
    container: app-chrome / inline-size;
    overflow: hidden;
    block-size: 16rem;
    color: var(--cn-text);
    background: var(--cn-background);
    border: 1px solid var(--cn-color-border);
  }

  .chrome-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--cn-grid);
    color: inherit;
    background: none;
    border: none;
  }

  .attachment-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--cn-grid);
    padding: var(--cn-grid) var(--cn-gap);
    color: var(--cn-text);
    background: var(--cn-surface-1);
    border-radius: var(--cn-border-radius-medium);
  }

  .attachment-chip button {
    display: inline-flex;
    padding: 0;
    color: inherit;
    background: none;
    border: none;
  }
</style>
