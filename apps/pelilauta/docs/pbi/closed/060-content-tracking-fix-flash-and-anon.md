# PBI-060: Content Tracking - Fix Flash & Anon Leak

## Goal
Eliminate the "Flash of Unread Content" and ensure strict Progressive Enhancement for anonymous users, as defined in `plans/content-tracking/spec.md`.

## Background
- **Flash**: The current `hasSeen` store returns `false` (Unread) when the subscription is missing or NULL. This causes UI indicators to briefly show "Unread" while the subscription is loading, before flipping to "Read" or their true state.
- **Anon Leak**: Components run logic that might attempt to access store data or calculate states for anonymous users, violating the "CSR Only / Progressive Enhancement" layer rule.

## Requirements

### 1. Fix Store Default State
- **File**: `src/stores/session/subscriber.ts`
- **Change**: `hasSeen` computed function should return `true` (Seen/Read) or a neutral state when `$subscriber` is `null`.
    - *Rationale*: It is better to default to "No Notification" and then show a notification than to show one and hide it (anti-pattern).
    - *Wait*: If defaulting to "Seen", verify this doesn't suppress legitimate unread notifications if the store loads slowly. Ideally, UI should handle a "Loading" state, but "Seen" is the safe default for "No Flash".

### 2. Component Guardrails
- **Components**:
    - `src/components/svelte/frontpage/CardSubscription.svelte`
    - `src/components/svelte/threads/ThreadSubscriber.svelte`
- **Change**:
    - Ensure `element.notify` defaults to `false` (or class is removed) *before* any logic runs.
    - Strictly check for `uid` presence before running any effect.
    - If `!uid`, ensure the indicator is explicitly hidden (clean up possible stale state if user logged out).

## Acceptance Criteria
- [ ] Reloading the front page as a logged-in user does NOT show a flash of unread indicators for read threads.
- [ ] Anonymous users see NO unread indicators and trigger NO console errors or store logic.
- [ ] `hasSeen` returns `true` (or safe default) when subscriber data is null.
