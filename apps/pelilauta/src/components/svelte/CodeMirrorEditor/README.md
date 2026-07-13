# CodeMirror Editor Component

A Svelte component that wraps CodeMirror 6 for markdown editing with Cyan Design System integration.

## Features

- **Direct CodeMirror Integration**: Svelte component directly manages CodeMirror instance without Shadow DOM
- **Svelte Reactivity**: Uses `$state`, `$derived`, and `$effect` for reactive properties
- **Form Integration**: Native Svelte form bindings with hidden input support
- **Simplified Focus**: Direct focus management without Shadow DOM delegation
- **CSS Flexibility**: No Shadow DOM means direct styling with Cyan Design System classes
- **Event Handling**: Native Svelte event forwarding
- **HTML-to-Markdown Paste**: Automatic conversion of pasted HTML content using Turndown with GFM support
- **Security**: DOMPurify sanitization of pasted HTML content
- **Markdown Syntax Highlighting**: Full GitHub Flavored Markdown support

## Usage

### Basic Example

```svelte
<script lang="ts">
import CodeMirrorEditor from '@svelte/CodeMirrorEditor/CodeMirrorEditor.svelte';

let content = $state('');
</script>

<CodeMirrorEditor 
  bind:value={content}
  placeholder="Enter markdown text..."
/>
```

### With All Props

```svelte
<script lang="ts">
import CodeMirrorEditor from '@svelte/CodeMirrorEditor/CodeMirrorEditor.svelte';

let content = $state('# Hello World\n\nThis is **markdown**.');
let editorRef: any;

function handleInput(event: CustomEvent<string>) {
  console.log('Content changed:', event.detail);
}

function handleChange(event: CustomEvent<string>) {
  console.log('Content committed:', event.detail);
}
</script>

<CodeMirrorEditor 
  bind:this={editorRef}
  bind:value={content}
  placeholder="Enter markdown text..."
  disabled={false}
  required={true}
  gutter={true}
  autofocus={true}
  name="content"
  oninput={handleInput}
  onchange={handleChange}
/>

<button onclick={() => editorRef.focus()}>Focus Editor</button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Editor content (bindable with `bind:value`) |
| `placeholder` | `string` | `''` | Placeholder text shown when editor is empty |
| `disabled` | `boolean` | `false` | Read-only mode |
| `required` | `boolean` | `false` | Form validation requirement |
| `gutter` | `boolean` | `false` | Show line numbers |
| `autofocus` | `boolean` | `false` | Auto-focus on mount |
| `name` | `string` | `''` | Form field name (creates hidden input for form submission) |
| `oninput` | `function` | `undefined` | Callback fired on every content change |
| `onchange` | `function` | `undefined` | Callback fired when focus is lost and content changed |
| `onblur` | `function` | `undefined` | Callback fired when editor loses focus |
| `onfocus` | `function` | `undefined` | Callback fired when editor gains focus |

## Public Methods

Access methods using `bind:this`:

```svelte
<script>
let editorRef: any;
</script>

<CodeMirrorEditor bind:this={editorRef} />

<button onclick={() => editorRef.focus()}>Focus</button>
<button onclick={() => editorRef.select()}>Select All</button>
<button onclick={() => editorRef.insertText('Hello')}>Insert Text</button>
```

### Available Methods

- `focus()`: Focus the editor
- `select()`: Select all content
- `copy()`: Copy selected text to clipboard
- `insertText(text: string)`: Insert text at cursor position
- `getValue()`: Get current editor value
- `setValue(value: string)`: Set editor value programmatically

## Features

### HTML-to-Markdown Paste

When pasting HTML content (e.g., from a web browser or Google Docs), the editor automatically:
1. Sanitizes the HTML with DOMPurify (security)
2. Converts to Markdown using Turndown
3. Preserves GitHub Flavored Markdown features (tables, strikethrough, task lists)
4. Falls back to plain text if conversion fails

### Keyboard Shortcuts

- `Tab`: Indent line or selection
- `Shift+Tab`: Unindent line or selection
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Shift+Z`: Redo
- All standard CodeMirror keyboard shortcuts

### Syntax Highlighting

Supports Markdown syntax highlighting for:
- Headings (h1-h4)
- Bold and italic text
- Links
- Code blocks and inline code
- Quotes
- Lists

## Architecture

The component is built from these files:

- **CodeMirrorEditor.svelte**: Main Svelte component
- **codemirror-config.ts**: CodeMirror state configuration
- **cnEditorTheme.ts**: Cyan Design System theme and syntax highlighting
- **cnPasteHandler.ts**: HTML-to-Markdown paste handling
- **styles.css**: CSS custom properties for Cyan Design System integration
- **types.ts**: TypeScript type definitions

## Migration from Lit Component

If you're migrating from the old `<cn-editor>` Lit component:

### Before (Lit)
```html
<cn-editor 
  value={content}
  placeholder="Enter text..."
  disabled={false}
  oninput={handleInput}
></cn-editor>
```

### After (Svelte)
```svelte
<CodeMirrorEditor 
  bind:value={content}
  placeholder="Enter text..."
  disabled={false}
  oninput={handleInput}
/>
```

Key differences:
- Use `bind:value` instead of `value` attribute
- Event handlers receive `CustomEvent<string>` instead of DOM events
- Access editor methods via `bind:this` instead of `querySelector`
- No Shadow DOM, so styles apply directly

## Performance

- Bundle size: ~540 KB uncompressed (~188 KB gzipped)
- Includes CodeMirror 6, Turndown, and DOMPurify
- No Shadow DOM overhead
- Optimized for Svelte reactivity
