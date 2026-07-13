# CN-Editor Keystroke Capture Issue - Triage Plan

**Date:** October 9, 2025  
**Status:** Investigation Phase  
**Priority:** High (affects core editing functionality)

## Problem Statement

The `cn-editor` component intermittently fails to capture keyboard input. The editor appears focused (cursor visible) but keystrokes are not processed. However, paste operations work correctly, suggesting the issue is specific to keyboard event handling rather than general input processing.

### Symptoms
- ✅ **Works:** Pasting content via Ctrl+V or context menu
- ❌ **Fails:** Typing with keyboard
- 🎯 **Visual State:** Cursor is visible, editor appears focused
- 🔄 **Frequency:** Intermittent - happens "sometimes"

### Affected Components
- `PageEditorForm.svelte` - Page content editor
- `ThreadEditorForm.svelte` - Thread creation/editing
- `HandoutEditor.svelte` - Site handout editor
- `CharacterEditorApp.svelte` - Character descriptions
- `ForkThreadApp.svelte` - Thread forking interface

## Source Code Analysis

### Architecture Overview

```typescript
<cn-editor>                           // Lit Web Component (host)
  #shadow-root
    <div #editor-container>           // Container div
      <div class="cm-editor">         // CodeMirror 6 root
        <div contenteditable="true">  // EditorView.contentDOM (actual input)
```

**Focus Chain:** User clicks → `<cn-editor>` host → `_handleHostFocus()` → `_editorView.focus()` → CodeMirror's `contentDOM`

### Critical Code Paths

#### 1. **Focus Delegation** (`_handleHostFocus`)

```typescript
protected _handleHostFocus(_event: FocusEvent) {
  if (this._isDelegatingFocus) {
    return; // Prevent re-entrance
  }

  if (this._editorView && document.activeElement !== this._editorView.contentDOM) {
    this._isDelegatingFocus = true;
    this._editorView.focus();

    requestAnimationFrame(() => {
      this._isDelegatingFocus = false;
    });
  }
}
```

**🔴 ISSUE #1: EditorView Readiness**
- `_editorView` is checked for existence but NOT for full initialization
- `_editorView.contentDOM` might not be ready even if `_editorView` exists
- No verification that CodeMirror extensions (keymaps) are loaded

**🔴 ISSUE #2: Race Condition in requestAnimationFrame**
- `_isDelegatingFocus` is reset asynchronously
- If a second focus event arrives before rAF callback, it will be blocked
- If focus is lost during rAF delay, we won't redelegate

#### 2. **Initialization Timing** (`firstUpdated`)

```typescript
firstUpdated() {
  if (this._editorContainer) {
    // 1. Add focusout listener
    this._editorContainer.addEventListener('focusout', this._handleFocusOut.bind(this));

    // 2. Create editor state
    const state = createEditorState(...);

    // 3. Create EditorView
    this._editorView = new EditorView({
      state,
      parent: this._editorContainer,
    });
  }
}
```

**🔴 ISSUE #3: Autofocus Timing**
- If component has `autofocus` attribute, browser fires focus event during/after `connectedCallback()`
- `_handleHostFocus()` will be called BEFORE `firstUpdated()` completes
- At that time, `_editorView` is `undefined`
- Focus delegation silently fails

**🔴 ISSUE #4: Event Listener Leak**
```typescript
// firstUpdated - creates NEW bound function
this._editorContainer.addEventListener('focusout', this._handleFocusOut.bind(this));

// disconnectedCallback - creates DIFFERENT bound function
this._editorContainer.removeEventListener('focusout', this._handleFocusOut.bind(this));
```
- `bind()` creates a new function each time
- Listener is never actually removed
- Not directly causing the hang, but indicates potential lifecycle issues

#### 3. **CodeMirror State Creation**

From `cnEditorConfig.ts` (external file):
- Creates EditorState with extensions: keymaps, history, markdown support, etc.
- Extensions are loaded synchronously
- **HOWEVER:** CodeMirror 6 may do lazy initialization of some extension state

**Hypothesis:** If focus is delegated immediately after `new EditorView()`, the keymap extensions might not be fully "active" yet.

## Root Cause Hypotheses

### Primary Hypothesis: **Autofocus Race Condition**

```
Timeline of failure:
1. Component renders with autofocus attribute
2. Browser fires 'focus' event → _handleHostFocus() called
3. _editorView is undefined (firstUpdated not complete)
4. Focus delegation silently fails
5. firstUpdated() creates EditorView
6. Editor appears ready but contentDOM never received focus
7. Keystrokes go nowhere (document.activeElement is host element)
8. Paste works because it uses clipboard API, not keyboard events
```

**Supporting Evidence:**
- Demo `index.html` uses `<cn-editor autofocus>`
- E2E tests manually trigger events, not relying on natural focus flow
- Issue is intermittent (timing-dependent)

### Secondary Hypothesis: **CodeMirror Extension Initialization Delay**

Even if focus delegation succeeds, CodeMirror's keymap extensions might need a tick to fully initialize. Focus arrives, but keystroke handlers aren't registered yet.

### Tertiary Hypothesis: **Focus Delegation Re-entrance Block**

If focus is rapidly moved (e.g., tab navigation, programmatic focus), the `_isDelegatingFocus` flag might block legitimate focus attempts while waiting for `requestAnimationFrame` callback.

## Action Plan

### Phase 1: Diagnosis (Days 1-2)

#### ✅ Task 1: Add Comprehensive Logging
Add diagnostic logging to understand the exact state when hangs occur:

```typescript
protected _handleHostFocus(_event: FocusEvent) {
  console.log('[CN-EDITOR] _handleHostFocus', {
    isDelegating: this._isDelegatingFocus,
    hasEditorView: !!this._editorView,
    hasContentDOM: !!this._editorView?.contentDOM,
    activeElement: document.activeElement?.tagName,
    timestamp: performance.now()
  });
  
  // ... rest of method
}
```

**Add logging to:**
- `constructor()` - Component created
- `connectedCallback()` - Added to DOM
- `firstUpdated()` - Before and after EditorView creation
- `_handleHostFocus()` - Every focus attempt
- CodeMirror's `onFocus` callback - When contentDOM gains focus

#### ✅ Task 2: Create Minimal Reproduction

Create `test-cn-editor-autofocus.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="path/to/cn-editor.js"></script>
</head>
<body>
  <h1>Test 1: Autofocus</h1>
  <cn-editor autofocus value="Type here immediately after load"></cn-editor>
  
  <h1>Test 2: Programmatic Focus</h1>
  <cn-editor id="manual"></cn-editor>
  <script>
    setTimeout(() => {
      document.getElementById('manual').focus();
    }, 10); // Focus before firstUpdated likely completes
  </script>
</body>
</html>
```

### Phase 2: Quick Fixes (Days 3-4)

#### 🔧 Fix 1: Guard Against Undefined EditorView

```typescript
protected _handleHostFocus(_event: FocusEvent) {
  if (this._isDelegatingFocus) {
    return;
  }

  // ✅ Add comprehensive readiness check
  if (!this._editorView || 
      !this._editorView.contentDOM || 
      !this._editorView.contentDOM.isConnected) {
    console.warn('[CN-EDITOR] EditorView not ready, deferring focus');
    // Retry focus after a tick
    requestAnimationFrame(() => {
      if (this._editorView) {
        this.focus(); // Trigger focus again
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

#### 🔧 Fix 2: Fix Event Listener Leak

```typescript
private _boundHandleFocusOut?: (event: FocusEvent) => void;

firstUpdated() {
  if (this._editorContainer) {
    // Store bound reference
    this._boundHandleFocusOut = this._handleFocusOut.bind(this);
    this._editorContainer.addEventListener('focusout', this._boundHandleFocusOut);
    
    // ... create EditorView
  }
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.removeEventListener('focus', this._handleHostFocus);
  this._editorView?.destroy();
  
  if (this._editorContainer && this._boundHandleFocusOut) {
    this._editorContainer.removeEventListener('focusout', this._boundHandleFocusOut);
  }
}
```

#### 🔧 Fix 3: Ensure Focus After Initialization

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
        this._editorView?.focus();
      });
    }
  }
}
```

### Phase 3: Defensive Mechanisms (Days 5-6)

#### 🛡️ Defense 1: Focus Health Check

```typescript
private _focusHealthCheckTimer?: number;

protected _handleHostFocus(_event: FocusEvent) {
  // ... existing focus delegation ...

  // ✅ Verify focus is working after a delay
  if (this._focusHealthCheckTimer) {
    clearTimeout(this._focusHealthCheckTimer);
  }

  this._focusHealthCheckTimer = window.setTimeout(() => {
    if (document.activeElement === this._editorView?.contentDOM) {
      // Focus is correct, but is keyboard working?
      this._verifyKeyboardInput();
    } else {
      console.error('[CN-EDITOR] Focus delegation failed, attempting recovery');
      this._recoverFocus();
    }
  }, 300);
}

private _verifyKeyboardInput() {
  // Check if keymap extensions are present
  const hasKeymaps = this._editorView?.state.facet(keymap) || [];
  if (hasKeymaps.length === 0) {
    console.error('[CN-EDITOR] No keymaps found, editor may be unresponsive');
  }
}

private _recoverFocus() {
  if (this._editorView) {
    // Try blur and refocus
    this._editorView.contentDOM.blur();
    setTimeout(() => {
      this._editorView?.focus();
    }, 10);
  }
}
```

#### 🛡️ Defense 2: Public Health Check Method

```typescript
/**
 * Diagnostic method - can be called from browser console
 * Example: document.querySelector('cn-editor').checkEditorHealth()
 */
public checkEditorHealth() {
  const health = {
    hasEditorView: !!this._editorView,
    hasContentDOM: !!this._editorView?.contentDOM,
    contentDOMConnected: this._editorView?.contentDOM?.isConnected || false,
    documentActiveElement: document.activeElement?.tagName,
    isDelegatingFocus: this._isDelegatingFocus,
    hasKeymaps: this._editorView?.state.facet(keymap)?.length || 0,
    stateDoc: this._editorView?.state.doc.toString().substring(0, 50),
  };

  console.table(health);

  // Try to fix if unhealthy
  if (health.hasEditorView && !health.contentDOMConnected) {
    console.error('❌ ContentDOM is not connected to document');
  }
  
  if (health.hasEditorView && health.hasKeymaps === 0) {
    console.error('❌ No keymaps registered');
  }

  if (document.activeElement !== this._editorView?.contentDOM) {
    console.warn('⚠️  Focus is not on contentDOM, attempting to fix...');
    this._editorView?.focus();
  }

  return health;
}
```

### Phase 4: Testing & Documentation (Days 7-8)

#### ✅ Test Plan

1. **Manual Testing**
   - [ ] Test autofocus on page load
   - [ ] Test programmatic focus immediately after creation
   - [ ] Test focus after navigating from another page
   - [ ] Test multiple editors on same page
   - [ ] Test rapid tab navigation between editors
   - [ ] Test in different browsers (Chrome, Firefox, Safari)

2. **E2E Tests**
   - [ ] Update `create-thread.spec.ts` to not manually trigger events
   - [ ] Add test for immediate typing after page load
   - [ ] Add test for tab navigation to editor
   - [ ] Verify all existing E2E tests still pass

3. **Integration Testing**
   - [ ] Test `PageEditorForm.svelte`
   - [ ] Test `ThreadEditorForm.svelte`
   - [ ] Test `HandoutEditor.svelte`
   - [ ] Test with dynamic value changes (content migration)

#### 📝 Documentation

Create `docs/cn-editor-keystroke-fix.md`:
- Root cause explanation
- Timeline of investigation
- Code changes made
- How to use `checkEditorHealth()`
- Prevention measures for future

## Success Criteria

- ✅ Editor captures keystrokes immediately on page load with autofocus
- ✅ Editor captures keystrokes after programmatic focus
- ✅ Editor captures keystrokes after navigation
- ✅ No console warnings about focus delegation
- ✅ All E2E tests pass without manual event triggering
- ✅ `checkEditorHealth()` shows green status in all scenarios

## Risk Assessment

**Low Risk Changes:**
- Adding logging
- Adding health check methods
- Fixing event listener leak

**Medium Risk Changes:**
- Modifying `_handleHostFocus` logic
- Adding retry mechanisms

**High Risk Changes:**
- Changing EditorView initialization timing
- Modifying CodeMirror state creation

**Mitigation:** Make changes incrementally, test after each change, keep comprehensive logging until issue is confirmed resolved for 2+ weeks in production.

## Timeline Estimate

- **Days 1-2:** Diagnosis and logging (non-invasive)
- **Days 3-4:** Implement and test fixes
- **Days 5-6:** Add defensive mechanisms
- **Days 7-8:** Integration testing and documentation
- **Week 2:** Monitor in production, remove verbose logging if stable

**Total:** ~10 working days to fully resolve and document

## Notes

- The E2E test workaround (manually triggering events) masked this issue
- Paste working but typing failing is a strong indicator of focus/keymap issue
- CodeMirror 6 is a mature library, so issue is likely in our integration layer
- Consider contributing fix back to cyan-design-system-4 repository once proven

## Next Steps

1. ✅ Create this triage document
2. ⏭️ Add diagnostic logging to cn-editor
3. ⏭️ Create minimal reproduction test case
4. ⏭️ Implement Fix #1 (EditorView readiness check)
5. ⏭️ Test and iterate

---

**Last Updated:** October 9, 2025  
**Document Owner:** Development Team  
**Related Issues:** cn-editor keystroke capture intermittent failure
