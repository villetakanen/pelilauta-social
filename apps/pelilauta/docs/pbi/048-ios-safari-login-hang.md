# PBI-048: iOS Safari Login Perpetual Loading

## Description
Users on iOS Safari report that the settings page (`[origin]/settings`) is perpetually loading. They appear to have a valid session, but the UI does not transition from the loading state.

## Symptoms
- Platform: iOS
- Browser: Safari
- Behavior: Perpetual loading spinner/state on settings page.

## Potential Causes
- Promise that never resolves (e.g., `await` on a hung process).
- IndexedDB issues (known to be flaky on iOS/Safari).
- Race condition where the state update is missed or ignored.
- Third-party cookie blocking or strict privacy settings affecting Firebase Auth or LocalStorage.

## Investigation Plan
1. Attempt to reproduce on an iOS/Safari environment.
2. Investigate `IndexedDB` usage and error handling, as this is a common pain point on Safari.
3. Review the session loading logic for potential deadlocks or missing error states.
4. Check for "User not authenticated" race conditions in `onMount` or effects.
