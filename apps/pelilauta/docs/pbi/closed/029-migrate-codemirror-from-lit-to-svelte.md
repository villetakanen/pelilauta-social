# PBI-029: Migrate CodeMirror Editor from Lit to Svelte Component

**Status:** 📋 Not Started  
**Priority:** High  
**Estimated Effort:** 2-3 sprints (2-4 weeks)

**User Story:** As a developer, I want the CodeMirror editor to be implemented as a Svelte component instead of a Lit web component, so that we can avoid Shadow DOM conflicts, improve integration with the Svelte ecosystem, and eliminate persistent focus and event handling issues between Lit, Svelte, and CodeMirror.

---

## Problem Statement

The current `cn-editor` Lit component wraps CodeMirror 6 and has been experiencing persistent technical issues due to architectural conflicts:

### Current Issues

1. **Shadow DOM Conflicts**: 
   - CodeMirror operates inside Lit's Shadow DOM
   - Svelte components struggle to interact with Shadow DOM internals
   - Focus delegation between Lit, Shadow DOM, and CodeMirror is fragile
   - Event bubbling across Shadow DOM boundary causes issues

2. **Focus Management Complexity**:
   - Multiple layers of focus handling: host element → Shadow DOM → CodeMirror contentDOM
   - Re-entrant focus calls causing race conditions
   - `_isDelegatingFocus` flag needed to prevent infinite loops
   - `autofocus` attribute requires special handling with `requestAnimationFrame`
   - Form integration focus issues with `ElementInternals`

3. **Integration Friction**:
   - Svelte's reactivity system doesn't naturally work with Lit properties
   - Shadow DOM encapsulation prevents direct CSS styling from parent components
   - Need to bridge two different component models (Lit vs Svelte)
   - Clipboard handling is complex:
     - Requires HTML sanitization with DOMPurify for security
     - HTML-to-Markdown conversion with Turndown + GFM
     - Error handling and fallback to plain text
     - Multiple selection support
     - Form integration with change events
     - (Note: The good news is this is already well-implemented in `cnPasteHandler.ts` and can be reused)

4. **Maintenance Burden**:
   - Three different compartments for dynamic configuration (placeholder, disabled, gutter)
   - Complex lifecycle management (connectedCallback, firstUpdated, updated, disconnectedCallback)
   - Memory leak prevention requires careful listener cleanup (`_boundHandleFocusOut`)
   - Form-associated element implementation adds complexity

5. **Developer Experience**:
   - Requires understanding both Lit and Svelte component models
   - Debugging issues across Shadow DOM boundary is difficult
   - Adding features requires navigating multiple abstraction layers
   - Testing is complicated by Shadow DOM and cross-framework interactions

**Note:** The good news is that your `cnEditorTheme.ts` is already well-designed with CSS custom properties instead of Shadow DOM-specific styles. This means the theme will work perfectly in the Svelte component without any modifications.

### Why This Matters

- **Architectural Consistency**: The app is primarily Svelte-based, mixing in Lit creates unnecessary complexity
- **Performance**: Removing Shadow DOM overhead and extra component layers
- **Maintainability**: Single component model is easier to maintain and extend
- **Reliability**: Direct Svelte-CodeMirror integration eliminates focus/event issues
- **Future-Proofing**: Easier to upgrade CodeMirror and add features without cross-framework concerns

---

## Proposed Solution

Create a new Svelte component that directly wraps CodeMirror 6, replacing the Lit `cn-editor` component. The new component will provide the same API surface but with better integration into the Svelte ecosystem.

### Core Features

1. **Direct CodeMirror Integration**: Svelte component directly manages CodeMirror instance without Shadow DOM
2. **Svelte Reactivity**: Use `$state` and `$derived` for reactive properties
3. **Form Integration**: Native Svelte form bindings instead of `ElementInternals`
4. **Simplified Focus**: Direct focus management without Shadow DOM delegation
5. **CSS Flexibility**: No Shadow DOM means direct styling with Cyan Design System classes
6. **Event Handling**: Native Svelte event forwarding without Shadow DOM boundary issues

### Component API

The new Svelte component should maintain API compatibility with the current Lit component where possible:

```typescript
interface CodeMirrorEditorProps {
  value: string;                    // Editor content (bindable)
  placeholder?: string;             // Placeholder text
  disabled?: boolean;               // Read-only mode
  required?: boolean;               // Form validation
  gutter?: boolean;                 // Show line numbers
  autofocus?: boolean;              // Auto-focus on mount
  name?: string;                    // Form field name
  
  // Event callbacks (Svelte style)
  oninput?: (event: CustomEvent<string>) => void;
  onchange?: (event: CustomEvent<string>) => void;
  onblur?: (event: FocusEvent) => void;
  onfocus?: (event: FocusEvent) => void;
}

// Public methods exposed via bind:this
interface CodeMirrorEditorInstance {
  focus(): void;
  select(): void;
  copy(): void;
  insertText(text: string): void;
  getValue(): string;
  setValue(value: string): void;
}
```

---

## Technical Implementation

### Phase 1: Create Svelte Component Shell

**File Structure:**
```
src/components/svelte/CodeMirrorEditor/
├── CodeMirrorEditor.svelte          # Main component
├── codemirror-config.ts             # CodeMirror state configuration (createEditorState)
├── cnPasteHandler.ts                # HTML-to-Markdown paste handling (reuse from Lit)
├── cnEditorTheme.ts                 # Cyan Design System theme (reuse from Lit)
├── styles.css                       # Cyan Design System CSS variables (adapt from Lit)
└── types.ts                         # TypeScript types
```

**Files to Reuse from Lit Component:**
- `cnPasteHandler.ts` - Already implements Turndown with GFM for paste handling
- `cnEditorTheme.ts` - Already implements cnMarkdownHighlightStyle and editorBaseTheme with Cyan Design System variables
- `styles.css` - CSS custom properties for Cyan Design System integration (needs class selector update)
- These files are pure CodeMirror extensions and can be reused without modification

**cnEditorTheme.ts (Existing Implementation - Reuse As-Is):**
```typescript
import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

export const editorBaseTheme = EditorView.theme(
  {
    // "&" targets the .cm-editor (root) element
    '&': {
      // Sizing and spacing
      width: '100%',
      height: '100%',
      minHeight: 'calc(4 * var(--cn-line))',
      margin: '0',
      boxSizing: 'border-box',

      // Borders with Cyan Design System variables
      border: '0',
      borderBottom: 'var(--cn-input-border)',
      borderRadius: 'var(--cn-input-border-radius)',
      outline: 'none',

      // Background and colors from Cyan Design System
      background: 'var(--color-input, black)',

      // Typography from Cyan Design System
      fontFamily: 'var(--cn-font-family-ui)',
      fontWeight: 'var(--cn-font-weight-ui)',
      fontSize: 'var(--cn-font-size-ui)',
      letterSpacing: 'var(--cn-letter-spacing-ui)',

      // Smooth transitions
      transition:
        'background 0.3s ease, border-color 0.3s ease, border-bottom-color 0.3s ease',
    },

    // Scrollable area
    '.cm-scroller': {
      fontFamily: 'inherit',
      lineHeight: 'var(--cn-line-height-ui)',
    },

    // Content area
    '.cm-content': {
      padding: 'var(--_cn-editor-padding)',
      color: 'var(--color-on-field)',
    },

    // Cursor styling
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--color-caret)',
      borderLeftWidth: '2px',
    },

    // Hover state
    '&:not(.cm-focused):hover': {
      borderBottomColor: 'var(--color-border-hover)',
    },

    // Focus state
    '&.cm-focused': {
      outline: 'none',
      borderBottomColor: 'var(--color-border-focus)',
    },

    // Placeholder text
    '.cm-placeholder': {
      lineHeight: 'var(--cn-line-height-ui)',
      color: 'var(--color-on-field-placeholder)',
    },

    // Selection styling
    '.cm-selectionBackground, & ::selection': {
      background: 'var(--color-selection) !important',
    },

    '&.cm-focused .cm-selectionBackground': {
      background: 'var(--color-selection) !important',
    },

    '&.cm-focused .cm-selectionBackground *': {
      color: 'var(--color-on-selection) !important',
    },

    // Active line
    '.cm-activeLine': {
      borderRadius: '4px',
      backgroundColor: 'transparent',
    },

    // Line numbers gutter
    '.cm-gutters': {
      minWidth: 'calc(2 * var(--cn-gap))',
      backgroundColor:
        'var(--color-elevation-1, var(--background-editor, black))',
      color: 'var(--color-on-button)',
      borderRight: '1px solid var(--color-border, #ddd)',
    },

    // Active line in gutter
    '.cm-gutter.cm-lineNumbers .cm-activeLineGutter': {
      width: '100%',
      backgroundColor:
        'var(--color-elevation-2, var(--background-editor, black))',
    },
    '.cm-activeLineGutter': {
      width: '100%',
      backgroundColor:
        'var(--color-elevation-3, var(--background-editor, black))',
    },

    // Markdown specific
    '& .cm-inline-code': {
      color: 'red',
    },
    '& .cm-quote': {
      backgroundColor: 'var(--color-secondary)',
    },
  },
  { dark: document.body.classList.contains('dark') },
);

export const cnMarkdownHighlightStyle = HighlightStyle.define([
  // Heading styles with Cyan Design System typography
  {
    tag: t.heading1,
    fontSize: 'var(--cn-font-size-h1)',
    fontWeight: 'var(--cn-font-weight-h1)',
    lineHeight: 'var(--cn-line-height-h1)',
    color: 'var(--color-heading-1)',
  },
  {
    tag: t.heading2,
    fontSize: 'var(--cn-font-size-h2)',
    fontWeight: 'var(--cn-font-weight-h2)',
    lineHeight: 'var(--cn-line-height-h2)',
    color: 'var(--color-heading-1)',
  },
  {
    tag: t.heading3,
    fontSize: 'var(--cn-font-size-h3)',
    fontWeight: 'var(--cn-font-weight-h3)',
    lineHeight: 'var(--cn-line-height-h3)',
    color: 'var(--color-heading-2)',
  },
  {
    tag: t.heading4,
    fontSize: 'var(--cn-font-size-h4)',
    fontWeight: 'var(--cn-font-weight-h4)',
    lineHeight: 'var(--cn-line-height-h4)',
    color: 'var(--color-heading-2)',
  },

  // Text styling with Cyan Design System colors
  { tag: t.strong, fontWeight: 'bold', color: 'var(--color-on-code-strong)' },
  {
    tag: t.emphasis,
    fontStyle: 'italic',
    color: 'var(--color-on-code-emphasis)',
  },
  { tag: t.link, textDecoration: 'underline' },
  {
    tag: t.monospace,
    color: 'var(--color-on-code)',
    backgroundColor: 'var(--color-code)',
    fontFamily: 'var(--cn-font-family-mono, monospace)',
  },
  {
    tag: t.quote,
    class: 'cm-quote',
  },
]);
```

**Key Features of cnEditorTheme.ts:**
- ✅ **Cyan Design System Integration**: Uses all `--cn-*` and `--color-*` CSS variables
- ✅ **Dark Mode Support**: Detects dark mode via `document.body.classList.contains('dark')`
- ✅ **Responsive Typography**: Heading styles (h1-h4) with proper font sizing and weights
- ✅ **Interactive States**: Hover and focus states with border color changes
- ✅ **Markdown Syntax Highlighting**: Styles for bold, italic, links, code, quotes
- ✅ **Accessible Selection**: Custom selection colors with proper contrast
- ✅ **Line Number Gutter**: Styled with elevation colors and active line highlighting
- ✅ **No Shadow DOM Dependency**: Works perfectly outside Shadow DOM
- ✅ **No Modification Needed**: This file is pure CodeMirror and can be reused as-is in Svelte component

**Why These Files are Perfect for Svelte:**

Both `cnEditorTheme.ts` and `cnPasteHandler.ts` are pure CodeMirror extensions with no framework dependencies:

**cnEditorTheme.ts:**
- No `:host` selectors that only work in Shadow DOM
- All styling via CSS custom properties that work anywhere
- Dark mode detection works the same way in Svelte
- No refactoring needed - just import and use

**cnPasteHandler.ts:**
- Pure CodeMirror `domEventHandlers` extension
- No Lit component lifecycle dependencies
- No Shadow DOM event handling quirks
- Works identically in light DOM (Svelte) or Shadow DOM (Lit)
- DOMPurify and Turndown are framework-agnostic libraries
- No refactoring needed - just import and use

**styles.css (Cyan Design System Variables):**

The Lit component has a CSS file that defines CSS custom properties for Cyan Design System integration. This needs a minor update for Svelte:

```css
/*
 * Default variable values for the editor and Cyan Design System tokens.
 * 
 * NOTE: Changed from `cn-editor` element selector to `.codemirror-editor-container`
 * class selector for Svelte component compatibility.
 */

.codemirror-editor-container {
  --_cn-editor-padding: var(--cn-grid, 0.5rem);
  --_cn-editor-border: var(--cn-editor-border, none);
  --_cn-editor-border-bottom: var(--cn-border);
  --_cn-editor-border-radius: var(--cn-border-radius-field, 0 1rem 0 0);
  
  /* Caret color with light-dark() function for theme switching */
  --color-caret: light-dark(var(--chroma-primary-90), var(--chroma-primary-30));
  
  /* Markdown syntax colors */
  --color-on-code-strong: light-dark(
    var(--chroma-primary-80),
    var(--chroma-primary-40)
  );
  --color-on-code-emphasis: light-dark(
    var(--chroma-surface-70),
    var(--chroma-surface-40)
  );
  --color-on-code: light-dark(
    var(--chroma-primary-80),
    var(--chroma-primary-10)
  );
  --color-code: light-dark(var(--chroma-primary-10), var(--chroma-primary-99));
}
```

**Key Change:** 
- `cn-editor` element selector → `.codemirror-editor-container` class selector
- This allows the same CSS variables to work in the Svelte component
- The `light-dark()` CSS function provides automatic theme switching based on user preference
- All Cyan Design System tokens (`--chroma-*`, `--cn-*`) remain unchanged

**CodeMirrorEditor.svelte:**
```svelte
<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { placeholder as cmPlaceholder, lineNumbers } from '@codemirror/view';
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
  onfocus
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
      changes: { from: 0, to: currentDoc.length, insert: value }
    });
  }
});

$effect(() => {
  if (!editorView) return;
  
  // Update placeholder
  editorView.dispatch({
    effects: placeholderCompartment.reconfigure(
      cmPlaceholder(placeholder)
    )
  });
});

$effect(() => {
  if (!editorView) return;
  
  // Update disabled state
  editorView.dispatch({
    effects: disabledCompartment.reconfigure(
      EditorState.readOnly.of(disabled)
    )
  });
});

$effect(() => {
  if (!editorView) return;
  
  // Update gutter
  editorView.dispatch({
    effects: gutterCompartment.reconfigure(
      gutter ? lineNumbers() : []
    )
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
      }
    }
  );
  
  editorView = new EditorView({
    state,
    parent: editorContainer
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
      selection: { anchor: 0, head: editorView.state.doc.length }
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
```

**codemirror-config.ts:**
```typescript
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  standardKeymap,
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting } from '@codemirror/language';
import {
  type Compartment,
  EditorState,
  type Extension,
} from '@codemirror/state';
import {
  placeholder as cmPlaceholder,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';

// Import custom extensions from existing Lit component
import { cnMarkdownHighlightStyle, editorBaseTheme } from './cnEditorTheme';
import { pasteHtmlAsMarkdown } from './cnPasteHandler';

// Define an interface for the callbacks
interface EditorCallbacks {
  onDocChanged: (newDoc: string) => void;
  onFocus: (event: FocusEvent, view: EditorView) => void;
  onBlur: () => void;
}

export function createEditorState(
  initialDoc: string,
  initialPlaceholder: string,
  initialIsDisabled: boolean,
  initialShowGutter: boolean,
  // Compartments are passed in so the component can manage their reconfiguration
  placeholderCompartment: Compartment,
  disabledCompartment: Compartment,
  gutterCompartment: Compartment,
  callbacks: EditorCallbacks,
): EditorState {
  // Combine all keymaps including Tab handling for indentation
  const allKeymaps = keymap.of([
    ...standardKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    indentWithTab, // Handles Tab and Shift+Tab for indentation
  ]);

  const extensions: Extension[] = [
    // Core editor features
    EditorView.lineWrapping,
    allKeymaps,
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    highlightSpecialChars(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    
    // Markdown language support (base only, no fenced code block languages)
    // Avoids importing @codemirror/language-data to keep bundle size small
    markdown({ base: markdownLanguage }),

    // Dynamic configuration via compartments
    placeholderCompartment.of(cmPlaceholder(initialPlaceholder)),
    disabledCompartment.of(EditorState.readOnly.of(initialIsDisabled)),
    gutterCompartment.of(initialShowGutter ? lineNumbers() : []),

    // Custom extensions from Lit component
    pasteHtmlAsMarkdown(), // Turndown plugin with GFM for HTML-to-Markdown paste
    syntaxHighlighting(cnMarkdownHighlightStyle, { fallback: true }),
    editorBaseTheme, // Cyan Design System theming

    // Document change listener
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbacks.onDocChanged(update.state.doc.toString());
      }
    }),
    
    // Focus/blur event handlers
    EditorView.domEventHandlers({
      focus: callbacks.onFocus,
      blur: () => {
        callbacks.onBlur();
        return false;
      }
    }),

    // Future Phase 3: live markdown rendering decorations
    // liveMarkdownDecorations(),
  ];

  return EditorState.create({
    doc: initialDoc,
    extensions: extensions,
  });
}
```

**cnPasteHandler.ts (Existing Implementation - Reuse As-Is):**
```typescript
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import DOMPurify from 'dompurify';
import type { Plugin } from 'turndown';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// --- Initialize and configure Turndown ---
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '*',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});
turndownService.use(gfm as Plugin);

export function pasteHtmlAsMarkdown(): Extension {
  return EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return false;
      }

      const pastedHTML = clipboardData.getData('text/html');

      // Handle HTML paste with conversion to Markdown
      if (pastedHTML && pastedHTML.length > 0) {
        event.preventDefault();

        let markdown = '';
        try {
          // Sanitize HTML before conversion for security
          const cleanHTML = DOMPurify.sanitize(pastedHTML, {
            USE_PROFILES: { html: true },
          });
          markdown = turndownService.turndown(cleanHTML);
        } catch (e) {
          console.error('Error during HTML to Markdown conversion:', e);
          // Fallback to plain text if conversion fails
          const pastedText = clipboardData.getData('text/plain');
          if (pastedText && pastedText.length > 0) {
            markdown = pastedText;
          } else {
            return true;
          }
        }

        if (markdown) {
          const { state } = view;
          // Support multiple selections
          const changes = state.selection.ranges.map((range) => ({
            from: range.from,
            to: range.to,
            insert: markdown,
          }));

          view.dispatch({ changes });
          
          // Dispatch change event for form integration
          view.dom.dispatchEvent(
            new Event('change', { bubbles: true, composed: true }),
          );
        }

        return true; // Event handled
      }

      // Handle plain text paste
      const pastedText = clipboardData.getData('text/plain');
      if (pastedText && pastedText.length > 0) {
        event.preventDefault();
        const { state } = view;
        const changes = state.selection.ranges.map((range) => ({
          from: range.from,
          to: range.to,
          insert: pastedText,
        }));
        view.dispatch({ changes });
        view.dom.dispatchEvent(
          new Event('change', { bubbles: true, composed: true }),
        );
        return true;
      }

      return false; // No clipboard data to handle
    },
  });
}
```

**Key Features of cnPasteHandler.ts:**
- ✅ **HTML Sanitization**: Uses DOMPurify to sanitize pasted HTML before conversion (security)
- ✅ **GitHub Flavored Markdown**: Full GFM support via turndown-plugin-gfm (tables, strikethrough, task lists)
- ✅ **Proper Markdown Formatting**: Configured with atx headings, fenced code blocks, proper delimiters
- ✅ **Error Handling**: Graceful fallback to plain text if HTML conversion fails
- ✅ **Multiple Selection Support**: Works with CodeMirror's multi-cursor feature
- ✅ **Form Integration**: Dispatches change events for form validation
- ✅ **Smart Fallback**: Handles plain text paste when no HTML is available
- ✅ **No Shadow DOM Dependency**: Pure CodeMirror extension, works anywhere
- ✅ **No Modification Needed**: Can be reused as-is in Svelte component

### Phase 2: Replace Lit Component Usage

**Search and Replace Strategy:**

1. **Find all usages of `<cn-editor>`**:
```bash
grep -r "<cn-editor" src/
```

2. **Replace with Svelte component**:
```svelte
<!-- Before (Lit) -->
<cn-editor 
  value={content}
  placeholder="Enter text..."
  disabled={false}
  required={true}
  gutter={true}
></cn-editor>

<!-- After (Svelte) -->
<script lang="ts">
import CodeMirrorEditor from '@svelte/CodeMirrorEditor/CodeMirrorEditor.svelte';

let content = $state('');
</script>

<CodeMirrorEditor 
  bind:value={content}
  placeholder="Enter text..."
  disabled={false}
  required={true}
  gutter={true}
/>
```

3. **Update imports**:
```typescript
// Remove Lit component import
// import '@11thdeg/cn-editor';

// Add Svelte component import
import CodeMirrorEditor from '@svelte/CodeMirrorEditor/CodeMirrorEditor.svelte';
```

### Phase 3: Testing and Validation

**Create Test Suite:**

```typescript
// test/components/CodeMirrorEditor.test.ts
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CodeMirrorEditor from '@svelte/CodeMirrorEditor/CodeMirrorEditor.svelte';

describe('CodeMirrorEditor', () => {
  it('renders with initial value', () => {
    const { container } = render(CodeMirrorEditor, {
      props: { value: 'Hello World' }
    });
    expect(container.textContent).toContain('Hello World');
  });

  it('updates value on input', async () => {
    let value = '';
    const { component } = render(CodeMirrorEditor, {
      props: { 
        value,
        oninput: (e) => { value = e.detail; }
      }
    });
    
    // Simulate typing
    // ... test implementation
    
    expect(value).toBe('New content');
  });

  it('calls onchange when focus is lost', () => {
    // ... test implementation
  });

  it('respects disabled state', () => {
    // ... test implementation
  });

  it('shows placeholder when empty', () => {
    // ... test implementation
  });

  it('handles paste with HTML conversion to Markdown', async () => {
    // Test that HTML clipboard content is converted to Markdown with GFM
    // The pasteHtmlAsMarkdown() extension should handle this automatically
    const { component } = render(CodeMirrorEditor, { props: { value: '' } });
    
    // Simulate pasting HTML (e.g., from a webpage or Google Docs)
    // Should convert to Markdown with proper formatting
    // Tables should be preserved (GFM), <strong> → **, <em> → _, etc.
    // ... test implementation
  });

  it('sanitizes pasted HTML before conversion', () => {
    // Test that DOMPurify removes dangerous HTML before conversion
    // ... test implementation
  });

  it('handles paste errors gracefully', () => {
    // Test fallback to plain text if HTML conversion fails
    // ... test implementation
  });

  it('exposes focus() method', () => {
    // ... test implementation
  });

  it('exposes select() method', () => {
    // ... test implementation
  });
});
```

**E2E Tests:**

```typescript
// e2e/codemirror-editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CodeMirror Editor', () => {
  test('should allow text input in thread creation', async ({ page }) => {
    await page.goto('/create/thread');
    
    const editor = page.locator('.codemirror-editor-container');
    await editor.click();
    await page.keyboard.type('# Test Thread\n\nThis is a test.');
    
    const content = await editor.textContent();
    expect(content).toContain('Test Thread');
  });

  test('should persist content when navigating away and back', async ({ page }) => {
    // ... test implementation
  });

  test('should handle form submission', async ({ page }) => {
    // ... test implementation
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // ... test implementation
  });
});
```

### Phase 4: Migration Checklist

**All files using `<cn-editor>`:**

- [ ] Find all instances: `grep -r "<cn-editor" src/`
- [ ] Find all instances: `grep -r "cn-editor" src/ | grep import`
- [ ] Create migration tracking spreadsheet with file paths
- [ ] Prioritize by usage frequency (high-traffic pages first)

**Expected locations:**
- Thread creation forms
- Reply forms
- Page editor
- Site description editors
- Character sheet editors
- Any markdown content input

**Migration steps per file:**
1. Import new Svelte component
2. Replace `<cn-editor>` with `<CodeMirrorEditor>`
3. Update prop binding syntax (attributes → Svelte bindings)
4. Update event handlers (DOM events → Svelte callbacks)
5. Update method calls (querySelector → bind:this)
6. Test functionality
7. Remove old Lit component import

### Phase 5: Cleanup

**After all migrations complete:**

1. **Remove Lit component**:
   - Remove `@11thdeg/cn-editor` package dependency
   - Remove any related CSS files
   - Remove cnEditorConfig.ts if no longer needed

2. **Update documentation**:
   - Update component usage examples
   - Update Copilot instructions
   - Add migration guide for future developers

3. **Performance audit**:
   - Measure bundle size reduction
   - Test focus performance
   - Verify no Shadow DOM issues remain

---

## Acceptance Criteria

### Component Development
- [ ] CodeMirrorEditor.svelte component created with full feature parity
- [ ] Component uses Svelte runes mode (`$state`, `$derived`, `$props`, `$bindable`)
- [ ] TypeScript types defined for all props and public methods
- [ ] Configuration utilities extracted to separate files
- [ ] Paste handler (cnPasteHandler.ts) copied from Lit component
- [ ] Theme file (cnEditorTheme.ts) copied from Lit component
- [ ] CSS variables file (styles.css) adapted from Lit component (selector change: `cn-editor` → `.codemirror-editor-container`)
- [ ] Component exports public methods: `focus()`, `select()`, `copy()`, `insertText()`, `getValue()`, `setValue()`

### Reactivity and State Management
- [ ] `value` prop is bindable with `$bindable`
- [ ] Placeholder updates reactively when prop changes
- [ ] Disabled state updates reactively when prop changes
- [ ] Gutter (line numbers) updates reactively when prop changes
- [ ] Form validation works with `required` prop
- [ ] Hidden input field for form integration when `name` prop provided

### Event Handling
- [ ] `oninput` callback fires on content changes
- [ ] `onchange` callback fires when focus is lost and content changed
- [ ] `onfocus` callback fires when editor gains focus
- [ ] `onblur` callback fires when editor loses focus
- [ ] No focus delegation issues or race conditions
- [ ] Paste event properly converts HTML to Markdown with GFM support
- [ ] Paste event sanitizes HTML with DOMPurify before conversion (security)
- [ ] Paste event handles plain text fallback gracefully
- [ ] Paste event supports multiple selections
- [ ] Paste event dispatches change events for form integration

### Focus Management
- [ ] `autofocus` prop works without requestAnimationFrame hacks
- [ ] Direct focus() calls work reliably
- [ ] No "focus not ready" warnings in console
- [ ] Tab navigation works naturally
- [ ] Focus state is visually clear

### Styling and CSS
- [ ] No Shadow DOM prevents direct styling - **now styles work directly**
- [ ] Cyan Design System CSS variables work (all `--cn-*` and `--color-*` variables)
- [ ] Component responsive and fills container properly
- [ ] Line numbers styled consistently (via editorBaseTheme)
- [ ] Placeholder text styled appropriately (via editorBaseTheme)
- [ ] Markdown syntax highlighting works (headings, bold, italic, code, quotes via cnMarkdownHighlightStyle)
- [ ] Dark mode detection works (via `document.body.classList.contains('dark')`)
- [ ] Interactive states work (hover, focus border colors)
- [ ] No CSS conflicts with Lit component styles

### Testing
- [ ] Unit tests cover all component features
- [ ] Unit tests verify reactivity of all props
- [ ] Unit tests verify public method behavior
- [ ] E2E tests cover real-world usage scenarios
- [ ] E2E tests verify form integration
- [ ] No test failures or console errors

### Migration
- [ ] All usages of `<cn-editor>` identified and documented
- [ ] High-priority pages migrated first (thread creation, replies, page editor)
- [ ] All `<cn-editor>` instances replaced with `<CodeMirrorEditor>`
- [ ] All event handlers updated to Svelte callback style
- [ ] All method calls updated to use bind:this
- [ ] No runtime errors after migration
- [ ] No TypeScript errors after migration

### Cleanup and Documentation
- [ ] @11thdeg/cn-editor package removed from package.json
- [ ] No imports remain from @11thdeg/cn-editor in codebase
- [ ] CodeMirror packages added as direct dependencies
- [ ] Lit `cn-editor` component files removed if present in project
- [ ] Old component CSS files removed if present
- [ ] Migration guide created for reference
- [ ] Copilot instructions updated with new component usage
- [ ] Component API documented in code comments
- [ ] PR includes before/after comparison and bundle size impact

### Performance and Quality
- [ ] Bundle size reduced (no Lit framework overhead)
- [ ] No performance regressions in editor responsiveness
- [ ] No memory leaks (verified with Chrome DevTools)
- [ ] Focus performance improved (measured)
- [ ] Code follows Svelte runes patterns from copilot-instructions.md

---

## Dependencies

## Dependencies

**CodeMirror Core (Required):**
- **@codemirror/state**: CodeMirror state management (Compartment, EditorState, Extension)
- **@codemirror/view**: CodeMirror view layer (EditorView, lineNumbers, placeholder, etc.)
- **@codemirror/commands**: Editor commands and keymaps (history, historyKeymap, indentWithTab, defaultKeymap, standardKeymap)
- **@codemirror/lang-markdown**: Markdown language support (markdown, markdownLanguage)
- **@codemirror/language**: Syntax highlighting support (syntaxHighlighting, HighlightStyle)
- **@lezer/highlight**: Syntax highlighting tags (for cnMarkdownHighlightStyle)
- **codemirror**: Main CodeMirror package (peer dependency)

**Note:** These CodeMirror packages are currently provided by the `@11thdeg/cn-editor` package. After migration, they will need to be added as direct dependencies of the main project.

**HTML-to-Markdown Conversion (Already in Project ✅):**
- **turndown**: HTML to Markdown conversion ✅ v7.2.1
- **turndown-plugin-gfm**: GitHub Flavored Markdown support ✅ v1.0.2
- **dompurify**: HTML sanitization ✅ v3.2.7

**Framework (Already in Project ✅):**
- **Svelte 5**: For runes mode and reactivity ✅ v5.39.6

**Testing (Already in Project ✅):**
- **@testing-library/svelte**: For unit testing ✅ (check if installed)
- **Playwright**: For E2E testing ✅ v1.50.0
- **vitest**: For unit testing ✅ v2.1.8
- **@types/turndown**: TypeScript types ✅ v5.0.5

**NOT NEEDED (Removed from Lit Component):**
- ❌ **lit**: Lit framework (removing this is the whole point!) - Currently at v3.2.1 in @11thdeg/cn-editor
- ❌ **@11thdeg/cn-editor**: The Lit component package itself (v4.0.0-beta.18) - will be removed after migration
- ❌ **@codemirror/language-data**: Language pack for non-Markdown languages (explicitly avoided for bundle size)
- ❌ **vite**: Build tool for cn-editor package (project already has Vite v6.0.11)

**Dependencies to Add:**
After migration, add these CodeMirror packages directly to project dependencies:
```json
{
  "dependencies": {
    "@codemirror/commands": "^6.8.1",
    "@codemirror/lang-markdown": "^6.3.2",
    "@codemirror/language": "^6.11.0",
    "@codemirror/state": "^6.5.2",
    "@codemirror/view": "^6.36.8",
    "@lezer/highlight": "^1.2.1",
    "codemirror": "^6.0.1"
  }
}
```

**Dependencies to Remove:**
After successful migration and cleanup:
```json
{
  "dependencies": {
    "@11thdeg/cn-editor": "4.0.0-beta.18"  // Remove this
  }
}
```

**Bundle Size Impact:**
Removing Lit framework and Shadow DOM overhead:
- **Lit framework removal**: ~15-20KB (minified + gzipped) - Currently in @11thdeg/cn-editor
- **Shadow DOM polyfills/overhead**: ~5-10KB
- **Simplified component wrapper**: ~5KB savings (no ElementInternals, no complex lifecycle)
- **CodeMirror packages**: +0KB (already bundled via @11thdeg/cn-editor, now direct dependencies)
- **HTML/Markdown packages**: +0KB (already in project: turndown, turndown-plugin-gfm, dompurify)
- **@11thdeg/cn-editor package removal**: Removes wrapper overhead

**Estimated net savings: 25-35KB (minified + gzipped)**

**Current Bundle Analysis:**
- Project currently imports `@11thdeg/cn-editor` which includes Lit + CodeMirror
- After migration: Direct CodeMirror imports without Lit framework
- No additional dependencies needed (turndown, dompurify already present)

Note: We intentionally **do NOT import @codemirror/language-data** to keep bundle size small. We only support Markdown language, not all programming languages.

**Files to Reuse from Existing Lit Component:**
- `cnPasteHandler.ts` - Paste handling with DOMPurify + Turndown + GFM (reuse as-is, ~80 lines)
- `cnEditorTheme.ts` - Cyan Design System theme and syntax highlighting (reuse as-is, ~200 lines)
- `styles.css` - CSS custom properties for Cyan variables (adapt selector, ~30 lines)
- These are pure CodeMirror extensions with no Lit or Shadow DOM dependencies

---

## Out of Scope (Future Enhancements)

- **Syntax Highlighting Themes**: Advanced CodeMirror themes (keep basic for now)
- **Custom Language Modes**: Support for languages beyond Markdown
- **Collaborative Editing**: Real-time collaborative editing features
- **Vim/Emacs Keybindings**: Alternative keymap modes
- **Mobile Optimizations**: Touch-specific interactions
- **Accessibility Enhancements**: ARIA labels beyond basics, screen reader optimization
- **Auto-save**: Automatic content persistence
- **Version History**: Built-in undo/redo with history UI

---

## Implementation Phases

### Week 1: Component Development
1. **Add CodeMirror dependencies** to package.json (7 packages: @codemirror/*, codemirror)
2. Create Svelte component structure
3. Copy cnPasteHandler.ts from Lit component (no changes)
4. Copy cnEditorTheme.ts from Lit component (no changes)
5. Adapt styles.css from Lit component (change selector from `cn-editor` to `.codemirror-editor-container`)
6. Adapt codemirror-config.ts (createEditorState) for Svelte callbacks
7. Implement core CodeMirror integration in CodeMirrorEditor.svelte
8. Add reactive prop handling with $effect and Compartments
9. Implement public methods (focus, select, copy, insertText, etc.)
10. Write unit tests

### Week 2: Integration and Testing
7. Test component in isolation
8. Create E2E test suite
9. Identify all `<cn-editor>` usages
10. Create migration tracking spreadsheet
11. Document migration patterns

### Week 3-4: Migration
12. Migrate high-traffic pages first (thread creation, replies)
13. Migrate page editor
14. Migrate site editors
15. Migrate character sheet editors
16. Migrate any remaining usages
17. Test each migration thoroughly

### Week 4: Cleanup and Documentation
18. **Remove @11thdeg/cn-editor** from package.json dependencies
19. Verify no imports remain from the old package
20. Clean up unused code
21. Update documentation
22. Performance audit (measure bundle size reduction)
23. Final testing and QA
24. Merge to main

---

## Success Metrics

- **Zero Focus Issues**: No focus-related bugs or console warnings
- **100% Migration**: All `<cn-editor>` instances replaced
- **Bundle Size**: Measurable reduction in bundle size (estimate: 50-100KB)
- **Test Coverage**: >90% code coverage for new component
- **Performance**: No performance regressions in editor responsiveness
- **Developer Experience**: Simplified codebase, easier to maintain and extend
- **Zero Regressions**: All existing functionality preserved

---

## Risks and Mitigations

### Risk: Breaking Existing Functionality
**Mitigation**: 
- Maintain API compatibility where possible
- Comprehensive testing before migration
- Migrate incrementally (high-traffic pages first)
- Keep Lit component temporarily for rollback

### Risk: CodeMirror Integration Issues
**Mitigation**:
- Study existing Lit component implementation carefully
- Reference CodeMirror 6 documentation
- Test edge cases (paste, focus, form integration)
- Add debug utilities if needed

### Risk: Migration Takes Longer Than Expected
**Mitigation**:
- Create detailed migration tracking
- Prioritize critical pages
- Allow rollback option per page
- Don't remove Lit component until 100% migrated

### Risk: Performance Regressions
**Mitigation**:
- Benchmark before and after
- Use Chrome DevTools performance profiling
- Test with large documents
- Monitor production after deployment

---

## Related Work

- **Lit to Svelte Migration**: Part of ongoing effort to standardize on Svelte
- **Cyan Design System Integration**: Ensures consistent styling without Shadow DOM
- **Form Integration Improvements**: Better form handling with native Svelte bindings
- **Focus Management Refactor**: Simplifies focus handling across the app

---

## Priority Justification

**High Priority** because:
1. Current focus issues affect user experience daily
2. Blocks other Svelte migration work
3. Reduces technical debt significantly
4. Improves developer productivity
5. Aligns with architectural goals (Svelte-first)

---

## Definition of Done

- [ ] CodeMirrorEditor.svelte component fully implemented and tested
- [ ] All unit tests passing with >90% coverage
- [ ] All E2E tests passing
- [ ] All `<cn-editor>` instances migrated to new component
- [ ] Lit component dependency removed from package.json
- [ ] Bundle size improvement measured and documented
- [ ] No console errors or warnings in production
- [ ] Documentation updated (Copilot instructions, migration guide)
- [ ] Code reviewed and approved
- [ ] Deployed to production without regressions
- [ ] Performance metrics validated (no regressions)
- [ ] Team training completed on new component usage

---

## Notes

This migration is part of a broader strategic shift to Svelte throughout the application. Success here will inform future Lit-to-Svelte migrations and establish patterns for handling complex third-party library integrations (like CodeMirror) in Svelte components.

The key insight is that **Shadow DOM encapsulation, while powerful, creates unnecessary complexity when integrating libraries like CodeMirror with Svelte**. Direct integration without the Shadow DOM boundary eliminates entire classes of focus, event, and styling issues.

**Critical Discovery During PBI Planning:**

The existing `@11thdeg/cn-editor` implementation is **exceptionally well-designed** for migration:

1. **cnPasteHandler.ts**: Pure CodeMirror extension with no framework dependencies
   - DOMPurify sanitization, Turndown conversion, GFM support
   - Works identically in any context (Shadow DOM or light DOM)
   - Zero changes needed for Svelte

2. **cnEditorTheme.ts**: Uses CSS custom properties, not Shadow DOM styles
   - All Cyan Design System integration via CSS variables
   - Dark mode detection via body class (framework-agnostic)
   - Zero changes needed for Svelte

3. **styles.css**: Minimal CSS with only one selector change needed
   - `cn-editor` element selector → `.codemirror-editor-container` class
   - All CSS variables remain unchanged

4. **Dependencies**: Project already has turndown, turndown-plugin-gfm, dompurify
   - Only need to add CodeMirror packages (currently nested in @11thdeg/cn-editor)
   - No new HTML/Markdown conversion dependencies needed

**Why This Is Significant:**

The migration is **not a rewrite** but rather **unwrapping a well-designed CodeMirror integration from its Lit container**. The hard problems (paste handling, theming, configuration) are already solved in a framework-agnostic way. This reduces:
- **Risk**: Core functionality is proven and tested
- **Effort**: ~80% of code can be reused with minimal changes
- **Timeline**: From 3 sprints down to 1.5-2 sprints

**Estimated effort breakdown:**
- Component development: 3-5 days (mostly Svelte wrapper + tests)
- Testing: 2-3 days
- Migration work: 5-7 days (depends on number of usages)
- Cleanup and documentation: 1-2 days
- **Total: 11-17 days (1.5-2.5 sprints with buffer)**

**Package Management:**
- **Add**: 7 CodeMirror packages as direct dependencies (~150KB total, but already in bundle via @11thdeg/cn-editor)
- **Remove**: @11thdeg/cn-editor package (saves ~25-35KB by removing Lit framework overhead)
- **Keep**: turndown, turndown-plugin-gfm, dompurify (already in project)
- **Net bundle impact**: -25 to -35KB (savings from removing Lit framework)
