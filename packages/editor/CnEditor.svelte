<script lang="ts">
/**
 * The Svelte host for the markdown editor. It owns a lifecycle and nothing
 * else: mount, sync the four semantic props onto the handle, destroy. Every
 * decision about what the editor is lives in the factory it calls.
 *
 * `value` is bindable, and the sync is one-directional per side — the handle
 * reports a change and the prop takes it; the prop changes and the handle takes
 * it, unless it already reads that. Which is the external-write contract: a
 * consumer can prefill or reset the document, and cannot stream into it while
 * the reader is typing.
 */
import { onDestroy, onMount } from 'svelte';
import { createEditor, type EditorHandle } from './createEditor';
import './styles/editor.css';

interface Props {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  gutter?: boolean;
  dark?: boolean;
  /** Renders a hidden input, for a form that reads the document from FormData. */
  name?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}

let {
  value = $bindable(''),
  placeholder = '',
  disabled = false,
  gutter = false,
  dark,
  name,
  onChange,
  onBlur,
}: Props = $props();

let target: HTMLDivElement;
let handle: EditorHandle | undefined = $state();

onMount(() => {
  handle = createEditor(target, {
    value,
    placeholder,
    disabled,
    gutter,
    dark,
    onChange: (next) => {
      value = next;
      onChange?.(next);
    },
    onBlur,
  });
});

onDestroy(() => {
  handle?.destroy();
  handle = undefined;
});

/*
 * Four effects rather than one, so a placeholder changing does not dispatch a
 * document transaction and a disabled flag does not reconfigure the gutter.
 */
$effect(() => {
  if (handle && value !== handle.getValue()) handle.setValue(value);
});
$effect(() => {
  handle?.setPlaceholder(placeholder);
});
$effect(() => {
  handle?.setDisabled(disabled);
});
$effect(() => {
  handle?.setGutter(gutter);
});
</script>

<div bind:this={target} class="cn-editor">
  {#if name}
    <input type="hidden" {name} {value} />
  {/if}
</div>
