# PBI-058: Discussion Navigation

## Goal
Implement a Floating Action Button (FAB) navigation system in the Discussion view to allow users to easily jump to unread replies or the latest content, as specified in `docs/specs/reply-bubbles.md`.

## Requirements

### 1. Floating Action Button (FAB)
- **Component**: `src/components/svelte/discussion/DiscussionSection.svelte`
- **UI**: Add a FAB (sticky bottom-right or appropriate design system location).
- **Icon**: `down` arrow (or `double-down` if jumping to end).

### 2. Navigation Logic
- **State Tracking**: 
    - Identify the **first unread reply** based on `subscription` store (`hasSeen` / flowTime).
    - Determine if the user is already at the bottom.
- **Action**:
    - **Scenario A (Unread exists & not visible)**: Scroll smoothly to the `id` of the first unread reply.
    - **Scenario B (All read / Unread visible)**: Scroll to the bottom of the thread container.

### 3. Scroll Handling
- Use `element.scrollIntoView({ behavior: 'smooth' })`.
- Target the `id` added in **PBI-057**.

## Dependencies
- **PBI-057**: Requires `id` attributes on reply articles to function as scroll targets.

## Acceptance Criteria
- [ ] A FAB appears on the discussion view (mobile/desktop as per design).
- [ ] Clicking FAB when unread replies exist scrolls to the first unread reply.
- [ ] Clicking FAB when caught up scrolls to the latest reply.
- [ ] Manual scrolling remains uninterrupted.
