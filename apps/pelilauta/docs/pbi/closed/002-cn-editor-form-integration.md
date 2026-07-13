**Title:** cn-editor Form Integration Issues

**As a** developer using cn-editor in forms, **I want** the component to work seamlessly with standard form validation and submission patterns, **so that** I don't need to manually trigger events or implement workarounds.

---

### Description

The cn-editor component currently has integration issues when used within HTML forms. The component doesn't properly emit the necessary events that form validation libraries and native form handling expect, requiring manual workarounds.

#### Current Issues:

1. **Form Validation Integration:** The cn-editor doesn't trigger standard `input`, `change`, and `blur` events automatically when content changes, making it incompatible with form validation libraries.

2. **Manual Event Triggering Required:** Developers must manually dispatch events to make forms recognize content changes:
   ```javascript
   const editor = document.querySelector('cn-editor');
   editor.value = content;
   // Manual workaround required:
   editor.dispatchEvent(new Event('input', { bubbles: true }));
   editor.dispatchEvent(new Event('change', { bubbles: true }));
   editor.dispatchEvent(new Event('blur', { bubbles: true }));
   ```

3. **Inconsistent Form Behavior:** Submit buttons remain disabled even when valid content is entered, unless manual events are triggered.

#### Evidence from E2E Tests:

The issue is evident in our end-to-end tests where we have to use `page.evaluate()` to manually set values and trigger events instead of using standard Playwright form interaction methods like `fill()`.

### Root Cause

The cn-editor component likely doesn't implement proper form control patterns that browsers and form libraries expect from custom elements used in forms.

### Proposed Solution

The cn-editor should:

1. **Implement Form Control Interface:** Properly implement form-associated custom element patterns or ensure compatibility with form validation.

2. **Automatic Event Emission:** Automatically emit `input`, `change`, and `blur` events when:
   - Content is modified by user interaction
   - Content is set programmatically via the `value` property
   - Focus is lost from the editor

3. **Form Validation Support:** Support HTML5 form validation attributes like `required`, `minlength`, etc.

4. **Better Form Integration:** Ensure the component works with both native form validation and popular form libraries.

### Acceptance Criteria

- [ ] Setting `editor.value = "content"` automatically triggers appropriate form events
- [ ] The component works with Playwright's `fill()` method without manual event triggering
- [ ] Form validation libraries can detect content changes without manual workarounds
- [ ] Submit buttons automatically enable/disable based on content validity
- [ ] The component supports HTML5 validation attributes (`required`, `minlength`, etc.)
- [ ] Standard form submission includes the editor's content without manual intervention

### Impact

**High Priority** - This affects developer experience and makes the component difficult to integrate into existing form workflows. The current workarounds are brittle and make testing more complex.

### Testing Notes

To verify the fix, the following should work without manual event triggering:

```javascript
// Should work automatically after fix:
await page.getByRole('textbox').fill('content'); // or similar semantic locator
await expect(submitButton).toBeEnabled();
```

Instead of the current workaround:

```javascript
// Current workaround that shouldn't be necessary:
await page.evaluate((content) => {
  const editor = document.querySelector('cn-editor');
  editor.value = content;
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  // ... more manual events
}, 'content');
```
