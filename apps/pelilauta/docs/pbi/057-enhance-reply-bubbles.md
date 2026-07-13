# PBI-057: Enhance Reply Bubbles

## Goal
Bring the `ReplyArticle` component up to the standard defined in `docs/specs/reply-bubbles.md` by adding deep linking support, timestamp visualization, and accessibility improvements.

## Requirements

### 1. Deep Linking Support
- **Component**: `src/components/svelte/discussion/ReplyArticle.svelte`
- **Change**: Add an `id` attribute to the root `<article>` element.
- **Value**: `reply.key` (ensure it is unique and valid for an ID, usually Firestore keys are safe, but alphanumeric check is good).
- **Test**: Verify that visiting `#<reply-key>` scrolls the browser to that reply.

### 2. Timestamp Display
- **Component**: `src/components/svelte/discussion/ReplyArticle.svelte`
- **Location**: Bottom-right of the bubble content area (flex-end).
- **Condition**: 
    - Always show if design permits, OR
    - Show `updatedAt` if `updatedAt` != `createdAt` (Edited state).
- **Design**: 
    - Classes: `text-small text-low` (as per design system).
    - Format: Relative time (e.g., "date-fns/formatDistanceToNow" or similar util).
- **Structure**:
  ```svelte
  <div class="flex flex-col">
    <div class="reply-content">...content...</div>
    {#if reply.updatedAt}
      <span class="text-small text-low self-end">
        {formatTime(reply.updatedAt)}
      </span>
    {/if}
  </div>
  ```

### 3. Accessibility & Semantics
- **ARIA**: Add `aria-labelledby` to the `<article>` pointing to the author nickname element ID.
- **Roles**: Ensure the toolbar uses `<nav>` or `role="toolbar"` if appropriate (check `cn-menu` usage).

## Acceptance Criteria
- [ ] Clicking a link with `#reply-<key>` jumps to the correct reply.
- [ ] Reply shows an "Edited <time>" or timestamp at the bottom right.
- [ ] Timestamp uses `text-small text-low` styles.
- [ ] Screen readers announce the reply context correctly.
