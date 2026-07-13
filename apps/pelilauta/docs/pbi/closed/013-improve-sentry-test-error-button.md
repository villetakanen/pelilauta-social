# PBI: Improve Sentry Test Error Button (Bespoke Component)

**Title:** Fix and Improve Sentry Test Error Button as a Bespoke Component

**As an** admin, **I want** a properly working test error button provided as a small, reusable Svelte component that sends errors to Sentry monitoring, **so that** I can verify that error tracking is working correctly in different environments without complicating the `AdminTray` implementation.

---

### Description

The current admin tooling includes a test error button, but embedding the button directly inside the `AdminTray` creates complexity and introduced bad patterns. Instead, we'll supply a small, focused Svelte component that the tray (or any admin UI) can import and use. The component will encapsulate Sentry integration, error context, and user feedback.

1. **Mixed paradigms**: Uses vanilla JavaScript event listeners inside a Svelte component
2. **Poor error handling**: Doesn't properly integrate with our Sentry error capture utility
3. **No feedback**: No visual feedback to confirm the error was sent
4. **Limited testing**: Only throws a basic error without context

The button should be properly implemented using Svelte patterns and integrate with our existing Sentry utilities to provide comprehensive error testing capabilities.

#### Current Issues Observed

- An admin test button exists but is implemented with non-idiomatic patterns (vanilla DOM, inline template scripts).
- Embedding Sentry integration directly into `AdminTray.svelte` increases coupling and makes the tray harder to maintain.

#### Proposed Implementation (Updated)

Create a small, reusable Svelte component at:

`src/components/svelte/admin/SentryTestButton.svelte`

This component will:
- Use proper Svelte event handling and reactive state
- Import and use `captureError` from `@utils/client/sentry`
- Provide user feedback (success / failure message) that auto-clears after 3s
- Include rich error context (component, action, timestamp, userAgent, url)
- Be importable by `AdminTray.svelte` (or any other admin UI) without forcing implementation details into the tray

Example usage in `AdminTray.svelte`:

```svelte
<script lang="ts">
  import SentryTestButton from '@components/svelte/admin/SentryTestButton.svelte';
  // ... other imports
</script>

<li>
  <SentryTestButton />
</li>
```

### Benefits

- **Proper Svelte Implementation**: Uses Svelte event handling and reactive state
- **Sentry Integration**: Properly uses our `captureError` utility with context
- **User Feedback**: Visual confirmation that the error was sent
- **Rich Context**: Provides useful debugging information with the error
- **Consistency**: Matches the styling and patterns of other admin tools
- **Better Debugging**: Helps verify Sentry configuration in different environments

### Implementation Details

#### Files to Modify:

1. **`src/components/svelte/admin/SentryTestButton.svelte`** (new)
  - Implement the reusable Svelte component that encapsulates Sentry test logic
  - Keep `AdminTray.svelte` changes minimal: import and render the new component where needed

#### Error Context Information:

The test error will include:
- Component name and action for tracking
- Timestamp for correlation
- User agent for environment debugging
- Current URL for context
- Custom error message indicating it's a test

#### Visual Design:

- Use `warning` icon to indicate this is a test/diagnostic tool
- Show temporary success/failure message below the button
- Style consistent with other admin tray buttons
- Auto-clear feedback message after 3 seconds

### Acceptance Criteria

- [ ] There is a new component `src/components/svelte/admin/SentryTestButton.svelte` that implements the test button using Svelte patterns (no vanilla JS DOM access)
- [ ] Component imports and uses `captureError` from `@utils/client/sentry` (or a platform-appropriate wrapper)
- [ ] Clicking the button sends an error to Sentry with context fields: component, action, timestamp, userAgent, url
- [ ] Component shows temporary success or failure feedback under the button and clears it after ~3 seconds
- [ ] Component markup and styling are consistent with other admin buttons (uses Cyan components / icon)
- [ ] Admin tray can import the new component without additional logic changes
- [ ] No browser console errors or warnings introduced by the component
- [ ] Sentry dashboard shows the test error with the provided context when tested
### Testing Requirements

- [ ] Manual testing: Click the `SentryTestButton` → verify visual feedback appears
- [ ] Manual testing: Check Sentry dashboard for test error with context populated
- [ ] Manual testing: Verify feedback message disappears after 3 seconds
- [ ] Environment testing: Test in both development and production builds
- [ ] Console testing: Verify no JavaScript errors in browser console
- [ ] Error context testing: Verify all context fields are visible in Sentry

### Integration / Notes

- Keep `AdminTray.svelte` changes minimal: import and render `<SentryTestButton />` where appropriate. This keeps the tray focused on layout and composition and avoids mixing implementation details.
- The new component should use dynamic imports for Firestore/Firebase utilities only if needed by `captureError` (follow repository patterns).
- If `captureError` is not available client-side, mock or wrap server API calls in development for safe testing.
### Priority

**Low Priority** - This is a developer/admin tool improvement. The existing button partially works, but this enhances the debugging experience and follows proper Svelte patterns.

### Estimated Effort

**XSmall** - Simple refactoring of existing functionality:
- Remove 6 lines of problematic code
- Add 25 lines of proper Svelte implementation
- Import existing utility function
- No new dependencies or complex logic required

### Security Considerations

- Button is already protected by admin authentication
- Only available to users listed in `appMeta.admins`
- Test errors don't expose sensitive information
- Uses existing secure Sentry integration

### Technical Notes

#### Why This Implementation is Better:

1. **Svelte Best Practices**: Uses reactive state and proper event handling
2. **Integration**: Leverages existing Sentry utilities and patterns
3. **User Experience**: Provides immediate feedback on action success/failure
4. **Debugging**: Rich context helps identify environment-specific issues
5. **Maintainability**: Consistent with codebase patterns and easier to modify

#### Error Context Helps With:

- Identifying which admin triggered the test
- Correlating test errors with specific deployments
- Debugging Sentry configuration issues
- Verifying error capture in different browsers/environments
- Tracking test error frequency and patterns

This improvement makes the admin error testing more reliable, user-friendly, and consistent with the application's architecture patterns.
