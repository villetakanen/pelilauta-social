<script lang="ts">
import { Compartment, EditorState } from '@codemirror/state';
import {
  placeholder as cmPlaceholder,
  EditorView,
  lineNumbers,
} from '@codemirror/view';
import { onDestroy, onMount } from 'svelte';
import { createEditorState } from './codemirror-config';
import type { CodeMirrorEditorProps } from './types';

// Import styles for Cyan Design System integration
import './styles.css';

// Props with destructuring
interface Props extends CodeMirrorEditorProps {}
let {
  value = $bindable(''),
  placeholder = '',
  disabled = false,
  required = false,
  gutter = false,
  autofocus = false,
  name = '',
  oninput,
  onchange,
  onblur,
  onfocus,
}: Props = $props();

// Component state
let editorContainer: HTMLDivElement;
let editorView: EditorView | undefined = $state();
let valueOnFocus = $state('');

// Create compartments for dynamic configuration
const placeholderCompartment = new Compartment();
const disabledCompartment = new Compartment();
const gutterCompartment = new Compartment();

// Reactivity: Update editor when props change
$effect(() => {
  if (!editorView) return;

  // Update content if changed externally
  const currentDoc = editorView.state.doc.toString();
  if (value !== currentDoc) {
    editorView.dispatch({
      changes: { from: 0, to: currentDoc.length, insert: value },
    });
  }
});

$effect(() => {
  if (!editorView) return;

  // Update placeholder
  editorView.dispatch({
    effects: placeholderCompartment.reconfigure(cmPlaceholder(placeholder)),
  });
});

$effect(() => {
  if (!editorView) return;

  // Update disabled state
  editorView.dispatch({
    effects: disabledCompartment.reconfigure(EditorState.readOnly.of(disabled)),
  });
});

$effect(() => {
  if (!editorView) return;

  // Update gutter
  editorView.dispatch({
    effects: gutterCompartment.reconfigure(gutter ? lineNumbers() : []),
  });
});

// Form validation
let validationMessage = $derived.by(() => {
  if (required && !value.trim()) {
    return 'Please fill out this field.';
  }
  return '';
});

// Mount editor
onMount(() => {
  const state = createEditorState(
    value,
    placeholder,
    disabled,
    gutter,
    placeholderCompartment,
    disabledCompartment,
    gutterCompartment,
    {
      onDocChanged: (newDoc) => {
        if (value !== newDoc) {
          value = newDoc;
          oninput?.(new CustomEvent('input', { detail: newDoc }));
        }
      },
      onFocus: () => {
        valueOnFocus = value;
        onfocus?.(new FocusEvent('focus'));
      },
      onBlur: () => {
        if (valueOnFocus !== value) {
          onchange?.(new CustomEvent('change', { detail: value }));
        }
        onblur?.(new FocusEvent('blur'));
      },
    },
  );

  editorView = new EditorView({
    state,
    parent: editorContainer,
  });

  if (autofocus) {
    editorView.focus();
  }
});

onDestroy(() => {
  editorView?.destroy();
});

// Public methods
export function focus(): void {
  editorView?.focus();
}

export function select(): void {
  if (editorView) {
    editorView.dispatch({
      selection: { anchor: 0, head: editorView.state.doc.length },
    });
    editorView.focus();
  }
}

export function copy(): void {
  if (editorView) {
    const { state } = editorView;
    const selection = state.selection.main;
    if (!selection.empty) {
      const text = state.doc.sliceString(selection.from, selection.to);
      navigator.clipboard.writeText(text).catch(console.error);
    }
  }
}

export function insertText(text: string): void {
  if (editorView) {
    editorView.dispatch(editorView.state.replaceSelection(text));
    editorView.focus();
  }
}

export function getValue(): string {
  return value;
}

export function setValue(newValue: string): void {
  value = newValue;
}

// Note: Paste handling is now handled by the pasteHtmlAsMarkdown() extension
// in the CodeMirror configuration, so no need for a separate onPaste handler here.
// The extension automatically intercepts paste events and converts HTML to Markdown.
</script>

<div 
  bind:this={editorContainer}
  class="codemirror-editor-container"
  role="textbox"
  aria-label={placeholder}
  aria-required={required}
  aria-invalid={!!validationMessage}
  tabindex="0"
></div>

{#if name}
  <input type="hidden" {name} value={value} />
{/if}

<style>
.codemirror-editor-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* 
  Note: Most CodeMirror styling is handled by cnEditorTheme.ts (editorBaseTheme)
  which uses Cyan Design System CSS variables. The theme automatically applies:
  - Input field styling (--cn-input-border, --cn-input-border-radius)
  - Typography (--cn-font-family-ui, --cn-font-size-ui, etc.)
  - Interactive states (hover, focus) with --color-border-hover, --color-border-focus
  - Dark mode support (detects .dark class on body)
  - Markdown syntax highlighting (headings, bold, italic, code, quotes)
  
  Only add minimal container styles here. Let the theme handle the rest.
*/

:global(.codemirror-editor-container .cm-editor) {
  height: 100%;
}

:global(.codemirror-editor-container .cm-scroller) {
  overflow: auto;
}
</style>
