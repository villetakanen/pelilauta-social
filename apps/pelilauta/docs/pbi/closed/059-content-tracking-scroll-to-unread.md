# PBI-059: Content Tracking - Scroll to First Unread

## Goal
Implement "Scroll to First Unread" functionality in the Thread View as defined in `plans/content-tracking/spec.md`. When a user opens a thread with new replies, the page should automatically scroll to the first unread reply.

## Background
Currently, opening a thread marks it as "read" immediately, but does not visually guide the user to the new content. This forces users to manually scroll and hunt for what they haven't seen.

## Requirements

### 1. Logic Implementation
- **Component**: `src/components/svelte/discussion/DiscussionSection.svelte`
- **Trigger**: Logic must ONLY run if the URL contains `?jumpTo=unread`.
- **Logic**:
    1.  **On Mount**: Check URL search params. If `jumpTo=unread` exists:
    2.  **Read**: Capture current `seenEntities[threadKey]` from `$subscriber`.
    3.  **Find**: Identify the first reply with `createdAt > lastSeenTimestamp`.
    4.  **Scroll**: Use `scrollIntoView()` on the target.
    5.  **Update**: Call `setSeen(thread.key)`.

### 2. Update Thread Links
- **Component**: `src/components/server/FrontPage/ThreadCard.astro`
- **Change**: Update the "Discussion/Reply Count" link at the bottom (currently `#discussion`) to include `?jumpTo=unread`.
    - Example: `<a href={/threads/${thread.key}?jumpTo=unread#discussion} ...>`
- **Preserve**: The Main Card Link (Title/Cover) must remains as-is (links to top).

### 3. Store Interaction
- Ensure `hasSeen` or raw `$subscriber` data is accessible synchronously or handled correctly if loading.
- If `$subscriber` is loading, we might need to wait for it before executing this logic (or skip it to avoid jarring jumps).

### 4. Progressive Enhancement
- Logic **MUST NOT** run for anonymous users. Check `uid` or `isAuthenticated` before attempting this.

## Acceptance Criteria
- [ ] Opening a thread with unread replies scrolls the first unread reply into view.
- [ ] Opening a fully read thread maintains the default scroll position (top).
- [ ] Anonymous users experience no scrolling behavior.
- [ ] No errors are thrown if the store is not yet loaded.
