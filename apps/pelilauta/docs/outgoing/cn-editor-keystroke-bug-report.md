# Bug Report: cn-editor Intermittent Keystroke Capture Failure

**Component:** `@11thdeg/cn-editor`  
**Package:** `cyan-design-system-4`  
**Reported by:** pelilauta-17 project  
**Date:** October 9, 2025  
**Severity:** High - Core editing functionality affected  
**Repository:** https://github.com/villetakanen/cyan-design-system-4

## Summary

The `<cn-editor>` component intermittently fails to capture keyboard input after initialization. The editor appears visually focused (cursor visible, contentDOM has focus styling) but keystrokes are not processed by CodeMirror. However, paste operations (Ctrl+V) work correctly, indicating the issue is specific to keyboard event handling rather than general input processing.

## Impact

This bug affects all applications using `cn-editor` in the following scenarios:
- Pages with `<cn-editor autofocus>` attribute
- Programmatic focus immediately after component creation
- Navigation to pages containing cn-editor
- Multiple editors on the same page
- Rapid tab navigation between form fields

**Affected Applications:**
- Page content editors
- Thread/comment creation forms
- Character description editors
- Any form using cn-editor for markdown input

## Symptoms

✅ **Works:**
- Pasting content via Ctrl+V or context menu
- Mouse selection and dragging
- Toolbar button interactions
- Programmatic value setting

❌ **Fails:**
- Typing with keyboard
- Keyboard shortcuts (Ctrl+B, etc.)
- Arrow key navigation
- Enter/Tab key input

🎯 **Visual State:**
- Cursor is visible and blinking
- Editor appears to have focus
- `document.activeElement` points to `contentDOM`
- No console errors

🔄 **Frequency:**
- Intermittent (timing-dependent)
- More likely on page load with autofocus
- More likely after fast navigation
- Browser-independent (affects Chrome, Firefox, Safari)

## Steps to Reproduce

### Minimal Reproduction

Create `test-autofocus-bug.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module">
    import '@11thdeg/cn-editor';
  </script>
</head>
<body>
  <h1>Test: Autofocus Keystroke Bug</h1>
  
  <!-- This will intermittently fail to capture keystrokes -->
  <cn-editor autofocus placeholder="Try typing immediately when page loads..."></cn-editor>
  
  <p><strong>Steps:</strong></p>
  <ol>
    <li>Load this page</li>
    <li>Immediately try typing (within 100-200ms of load)</li>
    <li>Notice: cursor blinks, but no text appears</li>
    <li>Try pasting (Ctrl+V) - paste works!</li>
    <li>Click editor again - now typing works</li>
  </ol>
</body>
</html>
```

### Reproduction in Real Application

1. Navigate to a page with `<cn-editor autofocus>`
2. Page loads and editor is visually focused
3. Try typing immediately - keystrokes not captured
4. Paste content - works correctly
5. Click editor again or tab away and back - typing now works

### E2E Test Workaround (Proving the Issue)

Our E2E tests had to implement this workaround because natural focus doesn't work:

```typescript
// From e2e/create-thread.spec.ts
// Set cn-editor content using evaluate with MANUAL event triggering
await page.evaluate((content) => {
  const editor = document.querySelector('cn-editor') as HTMLElement & {
    value?: string;
    dispatchEvent?: (event: Event) => void;
  };
  if (editor && 'value' in editor) {
    editor.value = content;
    // ⚠️ WORKAROUND: Manually trigger events because natural input doesn't work
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    editor.dispatchEvent(new Event('blur', { bubbles: true }));
  }
}, 'Test content');
```

The fact that we cannot use natural Playwright `.fill()` or `.type()` methods proves the keyboard event handling is broken.

## Root Cause Analysis

### Architecture Context

```
<cn-editor>                           // Lit Web Component (host, tabindex="0")
  #shadow-root
    <div #editor-container>           // Container div
      <div class="cm-editor">         // CodeMirror 6 root
        <div contenteditable="true">  // EditorView.contentDOM (receives input)
```

**Focus Flow:**
1. User action → `<cn-editor>` host receives focus event
2. `_handleHostFocus()` intercepts and delegates to CodeMirror
3. Calls `_editorView.focus()` → focuses `contentDOM`
4. CodeMirror keymap extensions process keystrokes

### Primary Root Cause: Autofocus Race Condition

**The Problem:**

```typescript
// In cn-editor.ts
constructor() {
  super();
  this._internals = this.attachInternals();
  // ⚠️ Focus listener added early
  this.addEventListener('focus', this._handleHostFocus.bind(this));
}

connectedCallback(): void {
  super.connectedCallback();
  if (this.getAttribute('tabindex') === null) {
    this.setAttribute('tabindex', '0');
  }
  // At this point, if autofocus is set, browser fires focus event
  // But _editorView doesn't exist yet!
}

firstUpdated() {
  if (this._editorContainer) {
    // ... setup code ...
    
    // ⚠️ EditorView created HERE, AFTER focus may have already fired
    this._editorView = new EditorView({
      state,
      parent: this._editorContainer,
    });
  }
}

protected _handleHostFocus(_event: FocusEvent) {
  if (this._isDelegatingFocus) {
    return;
  }

  // ⚠️ This check passes (undefined is falsy)
  // ⚠️ But _editorView is undefined! Focus delegation silently fails
  if (
    this._editorView &&
    document.activeElement !== this._editorView.contentDOM
  ) {
    this._isDelegatingFocus = true;
    this._editorView.focus();

    requestAnimationFrame(() => {
      this._isDelegatingFocus = false;
    });
  }
  // Focus event completes, but nothing happened
  // Host element is focused, but contentDOM never received focus
}
```

**Timeline of Failure:**

```
0ms   - Component added to DOM (connectedCallback)
1ms   - Browser sees autofocus, fires 'focus' event
2ms   - _handleHostFocus called
3ms   - _editorView is undefined, focus delegation skipped
4ms   - Focus remains on host element
...
50ms  - firstUpdated() runs
51ms  - _editorView created
52ms  - Editor is ready, but focus is on wrong element
```

**Result:**
- Host element (`<cn-editor>`) has focus
- CodeMirror's `contentDOM` does NOT have focus
- Keystrokes are captured by host element, but not passed to CodeMirror
- CodeMirror's keymap extensions never receive keyboard events
- Paste works because it uses `navigator.clipboard` API, not keyboard events

### Secondary Issues

#### 1. No Readiness Check

```typescript
if (this._editorView && ...) {
  this._editorView.focus();
}
```

Checks existence but not readiness:
- `contentDOM` might not be created yet
- `contentDOM` might not be connected to document
- Keymap extensions might not be initialized

#### 2. Event Listener Memory Leak

```typescript
firstUpdated() {
  // Creates NEW bound function
  this._editorContainer.addEventListener('focusout', this._handleFocusOut.bind(this));
}

disconnectedCallback() {
  // Creates DIFFERENT bound function - listener never removed!
  this._editorContainer.removeEventListener('focusout', this._handleFocusOut.bind(this));
}
```

#### 3. Race Condition in Focus Guard

```typescript
this._isDelegatingFocus = true;
this._editorView.focus();

requestAnimationFrame(() => {
  this._isDelegatingFocus = false; // Async reset
});
```

If second focus event arrives before `requestAnimationFrame` callback:
- `_isDelegatingFocus` is still `true`
- Second focus attempt is blocked
- Focus can be lost

## Proposed Fixes

### Fix 1: Guard Against Unready EditorView (Critical)

```typescript
protected _handleHostFocus(_event: FocusEvent) {
  if (this._isDelegatingFocus) {
    return;
  }

  // ✅ Comprehensive readiness check
  if (!this._editorView || 
      !this._editorView.contentDOM || 
      !this._editorView.contentDOM.isConnected) {
    console.warn('[CN-EDITOR] EditorView not ready for focus, deferring...');
    
    // Retry after initialization completes
    requestAnimationFrame(() => {
      if (this._editorView?.contentDOM?.isConnected) {
        this._editorView.focus();
      }
    });
    return;
  }

  if (document.activeElement !== this._editorView.contentDOM) {
    this._isDelegatingFocus = true;
    this._editorView.focus();

    requestAnimationFrame(() => {
      this._isDelegatingFocus = false;
    });
  }
}
```

### Fix 2: Handle Autofocus After Initialization

```typescript
firstUpdated() {
  if (this._editorContainer) {
    // ... existing setup ...

    this._editorView = new EditorView({
      state,
      parent: this._editorContainer,
    });

    // ✅ If component should be focused, ensure it happens AFTER initialization
    if (this.hasAttribute('autofocus') || document.activeElement === this) {
      requestAnimationFrame(() => {
        if (this._editorView?.contentDOM?.isConnected) {
          this._editorView.focus();
        }
      });
    }
  }
}
```

### Fix 3: Fix Event Listener Leak

```typescript
private _boundHandleFocusOut?: (event: FocusEvent) => void;

firstUpdated() {
  if (this._editorContainer) {
    // ✅ Store bound reference
    this._boundHandleFocusOut = this._handleFocusOut.bind(this);
    this._editorContainer.addEventListener('focusout', this._boundHandleFocusOut);
    
    // ... rest of setup
  }
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.removeEventListener('focus', this._handleHostFocus);
  this._editorView?.destroy();
  
  // ✅ Remove correct listener
  if (this._editorContainer && this._boundHandleFocusOut) {
    this._editorContainer.removeEventListener('focusout', this._boundHandleFocusOut);
  }
}
```

### Fix 4: Add Diagnostic Method (Developer Experience)

```typescript
/**
 * Diagnostic method for debugging focus issues
 * Can be called from browser console:
 * document.querySelector('cn-editor').checkEditorHealth()
 */
public checkEditorHealth() {
  const health = {
    hasEditorView: !!this._editorView,
    hasContentDOM: !!this._editorView?.contentDOM,
    contentDOMConnected: this._editorView?.contentDOM?.isConnected || false,
    contentDOMHasFocus: document.activeElement === this._editorView?.contentDOM,
    hostHasFocus: document.activeElement === this,
    isDelegatingFocus: this._isDelegatingFocus,
    value: this.value.substring(0, 50),
  };

  console.table(health);

  // Auto-fix if possible
  if (health.hasEditorView && !health.contentDOMHasFocus) {
    console.warn('⚠️  ContentDOM does not have focus, attempting to fix...');
    this._editorView?.focus();
    setTimeout(() => {
      if (document.activeElement === this._editorView?.contentDOM) {
        console.log('✅ Focus restored successfully');
      } else {
        console.error('❌ Focus restoration failed');
      }
    }, 100);
  }

  return health;
}
```

## Testing Checklist

- [ ] Test `<cn-editor autofocus>` on page load
- [ ] Test programmatic `editor.focus()` immediately after creation
- [ ] Test focus after navigation from another page
- [ ] Test multiple editors on same page with tab navigation
- [ ] Test rapid focus changes (tab key spam)
- [ ] Test in Chrome, Firefox, Safari
- [ ] Verify E2E tests can use natural `.fill()` and `.type()` methods
- [ ] Verify no console warnings about focus delegation
- [ ] Test that `checkEditorHealth()` reports healthy state

## Workaround for Consumers

Until this is fixed in cn-editor, consumers can work around the issue:

```typescript
// Wait for initialization before focusing
import { onMount } from 'svelte';

let editorRef: HTMLElement;

onMount(() => {
  // Wait two animation frames to ensure CodeMirror is ready
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      editorRef?.focus();
    });
  });
});
```

Or in E2E tests, continue using the manual event dispatch pattern shown above.

## Additional Context

### Why Paste Works But Typing Doesn't

- **Paste:** Uses `navigator.clipboard.writeText()` and custom paste handler that directly dispatches to CodeMirror state
- **Typing:** Requires CodeMirror's keymap extensions to intercept keyboard events on `contentDOM`
- If `contentDOM` doesn't have focus, keymap extensions never see the events
- Browser captures keystrokes on host element, but they go nowhere

### Related Code

**Form Integration Fix (April 2024):** 
The component recently had a major overhaul for form integration that added the focus delegation mechanism. This is likely when the autofocus bug was introduced.

**Files Involved:**
- `packages/cn-editor/src/cn-editor.ts` (main component)
- `packages/cn-editor/src/cnEditorConfig.ts` (state creation)
- `packages/cn-editor/FORM-INTEGRATION-FIX.md` (recent changes doc)

## Priority Justification

**High Priority because:**
1. Affects core editing functionality across all consuming applications
2. Intermittent nature makes it hard for users to understand what's wrong
3. Users see a "focused" editor but cannot type - extremely frustrating UX
4. No error messages or visual feedback that something is wrong
5. Workarounds in every consuming application are complex and brittle
6. E2E tests cannot use standard testing patterns

## References

- Internal Triage Plan: `pelilauta-17/docs/cn-editor-triage.plan.md`
- E2E Test Workaround: `pelilauta-17/e2e/create-thread.spec.ts`
- Form Integration Changes: `cyan-design-system-4/packages/cn-editor/FORM-INTEGRATION-FIX.md`

---

**Contact:** pelilauta-17 development team  
**Ready for:** Immediate action - all analysis complete, fixes identified  
**Estimated Fix Time:** 1-2 days development + testing
